import {
  ArrayBindingPattern,
  ClassDeclaration,
  Declaration,
  EnumDeclaration,
  ExportAssignment,
  ExportDeclaration,
  FunctionDeclaration,
  getCombinedModifierFlags,
  ImportDeclaration,
  InterfaceDeclaration,
  isClassDeclaration,
  isEnumDeclaration,
  isExportAssignment,
  isExportDeclaration,
  isFunctionDeclaration,
  isIdentifier,
  isImportDeclaration,
  isInterfaceDeclaration,
  isModuleBlock,
  isModuleDeclaration,
  isTypeAliasDeclaration,
  isVariableDeclaration,
  ModifierFlags,
  ModuleDeclaration,
  Node,
  ObjectBindingPattern,
  SourceFile,
  Statement,
  SyntaxKind,
  TypeAliasDeclaration,
  VariableDeclaration,
} from 'typescript';
import { Analyzer } from '../util';
import { FileCache } from './file-cache';
import { DeclarationNode } from './declaration.type';
import { ExportFactory } from './declaration-factory';
import { FileEmptyImport, FileImportToken, File, FileReExportToken, IdPath } from './file.type';
import path from 'node:path';

export class FileBuilder {
  id: IdPath; // path relative to options.src
  name: string;
  depth: number;
  cache: FileCache;
  isExternalFile = false; // node_modules
  areReferencesResolved = false;
  recalculateAgain = false;
  unprocessedReexportReferences: IdPath[] = [];

  fileImports: FileImportToken[] = [];
  fileEmptyImports: FileEmptyImport[] = [];
  fileExports: DeclarationNode[] = [];
  fileReExports: FileReExportToken[] = []

  constructor(file: SourceFile, analyzer: Analyzer) {
    this.id = analyzer.getRelativePath(file.fileName);
    const idPathSplit = this.id.split(path.sep);
    this.name = idPathSplit.pop()!;
    this.depth = idPathSplit.length - 1;
    this.isExternalFile = analyzer.isExternalFile(file);
    this.cache = new FileCache(analyzer);

    const modulesStack: ModuleDeclaration[] = [];

    file.statements.forEach(node => {
      if (isModuleDeclaration(node))
        modulesStack.push(node)
      else
        this.pullStatementExportImport(node, analyzer);
    });

    // recursively pull all modules (modules can be nested)
    while (modulesStack.length) {
      const module = modulesStack.pop()!;
      const symbol = analyzer.getSymbol(module)!;
      if (!module.body || !isModuleBlock(module.body))
        continue;

      if (symbol.valueDeclaration && symbol.declarations && symbol.declarations.length > 1)
        continue; // todo its augmentation

      // todo no recursion for now
      // module.body.statements.forEach(statement => {
      //   if (isModuleDeclaration(statement))
      //     modulesStack.push(statement);
      //   else
      //     this.pullStatementExportImport(statement, analyzer);
      // });
      // todo remove
      const moduleExports = analyzer.getTopExportsFromFile(module);
      for (let i = 0; i < moduleExports.length; i++)
        this.pullStatementExportImport(moduleExports[i] as Statement, analyzer);
    }

    // build file exports (declarations)
    this.cache.cachedExports.forEach(node => {
      const ex = ExportFactory(node, analyzer);
      if (!ex)
        return;

      // ts overload, for now ignore todo
      const isNameDuplicated = this.fileExports.find(e => e.name === ex.name);
      if (!isNameDuplicated)
        this.fileExports.push(ex);
    });
    this.unprocessedReexportReferences.splice(0, this.unprocessedReexportReferences.length, ...this.cache.getUniqueReExportedFiles());
  }

  private pullStatementExportImport(node: Statement, analyzer: Analyzer): void {
    if (isImportDeclaration(node))
      return this.cacheImport(node, analyzer);

    if (isClassDeclaration(node)
        || isFunctionDeclaration(node)
        || isEnumDeclaration(node)
        || isInterfaceDeclaration(node)
        || isTypeAliasDeclaration(node))
      return this.cacheDeclaration(node);

    if (isVariableDeclaration(node))
      return this.cacheVariable(node, analyzer);

    if (isExportAssignment(node))
      return this.cacheExportAssignment(node, analyzer);

    if (isExportDeclaration(node))
      return this.cacheExportDeclaration(node, analyzer);

    // console.warn(`Unknown export type: ${SyntaxKind[node.kind]}`);
  }

  private getFlags(node: Node): { isExport: boolean, isDefault: boolean } {
    const flags = getCombinedModifierFlags(node as Declaration);
    const isExport = (flags & ModifierFlags.Export) !== 0;
    const isDefault = (flags & ModifierFlags.Default) !== 0;
    return { isExport, isDefault };
  }

  private cacheImport(node: ImportDeclaration, analyzer: Analyzer): void {
    const { resolvedPath, isExternal } = analyzer.getResolvedImportPath(node);
    this.cache.addImport(node, resolvedPath, isExternal)
  }

  private cacheDeclaration(node: ClassDeclaration | FunctionDeclaration | EnumDeclaration | InterfaceDeclaration | TypeAliasDeclaration): void {
    const { isExport, isDefault } = this.getFlags(node);
    if (isExport)
      this.cache.addExport(node);
  }

  private cacheVariable(node: VariableDeclaration, analyzer: Analyzer): void {
    const init = node.initializer;
    const name = node.name;
    const alias = init && isIdentifier(init) && analyzer.findIdentifierAliasImportPath(init);

    switch (name.kind) {
      case SyntaxKind.Identifier:{
        if (alias)
          this.cache.addReExport(name, alias.resolvedPath, alias.isExternal);
        else
          this.cache.addExport(name);
        break;
      }

      case SyntaxKind.ArrayBindingPattern:
      case SyntaxKind.ObjectBindingPattern:{
        // const [one] = [1,2]
        // const { d } = obj;
        const stack: (ObjectBindingPattern | ArrayBindingPattern)[] = [name];
        while (stack.length) {
          const item = stack.pop()!;
          item.elements.forEach(el => {
            if (el.kind !== SyntaxKind.BindingElement)
              return;
            if (el.name.kind === SyntaxKind.ArrayBindingPattern || el.name.kind === SyntaxKind.ObjectBindingPattern) {
              stack.push(el.name);
              return;
            }
            if (alias)
              this.cache.addReExport(el.name, alias.resolvedPath, alias.isExternal);
            else
              this.cache.addExport(el.name);
          });
        }
        break;
      }
    }
  }

  private cacheExportDeclaration(node: ExportDeclaration, analyzer: Analyzer): void {
    if (node.exportClause) {
      if (node.exportClause.kind === SyntaxKind.NamespaceExport) {
        // export * as x from './'
        const { resolvedPath, isExternal } = analyzer.getResolvedImportPath(node);
        this.cache.addReExport(node.exportClause, resolvedPath, isExternal);
        return;
      }
      // SyntaxKind.NamedExports
      node.exportClause.elements.forEach(element => {
        const isReExporting = !!element.parent.parent.moduleSpecifier;
        if (isReExporting) {
          const { resolvedPath, isExternal } = analyzer.getResolvedImportPath(element.parent.parent);
          this.cache.addReExport(element, resolvedPath, isExternal);
        }
        if (!isIdentifier(element.name))
          throw new Error(`Expected ExportSpecifier name to be Identifier, got: ${element.name.text}`);

        const alias = analyzer.findIdentifierAliasImportPath(element.name);
        if (alias)
          this.cache.addReExport(element, alias.resolvedPath, alias.isExternal);
        else
          this.cache.addExport(element);
      });
    } else {
      // export * from "foo"
      const { resolvedPath, isExternal } = analyzer.getResolvedImportPath(node);
      this.cache.addReExport(node, resolvedPath, isExternal);
    }
  }

  private cacheExportAssignment(node: ExportAssignment, analyzer: Analyzer): void {
    // export default [1,2,3] for example
    if (isIdentifier(node.expression)) {
      const foundAliasPath = analyzer.findIdentifierAliasImportPath(node.expression);
      if (foundAliasPath)
        return this.cache.addReExport(node, foundAliasPath.resolvedPath, foundAliasPath.isExternal)
    }
    this.cache.addExport(node.expression as any); // todo
  }

  build(): File {
    return {
      id: this.id,
      name: this.name,
      depth: this.depth,
      loc: 0,
      extension: '',
      isExternalFile: this.isExternalFile || undefined,
      exports: this.fileExports,
      emptyImports: this.fileEmptyImports,
      imports: this.fileImports,
      reexports: this.fileReExports,
    }
  }
}
