import ts from 'typescript';
import path from 'node:path';
import { Analyzer, IO } from '../../analyzer';
import { CodeFile, IdPath, NodeEnum } from '@lib/ast';
import { DeclarationFactory, ImportFactory } from './definitions';
import { TsNode } from './types';

export class CodeFileBuilder {
  code: CodeFile;
  tsImports = new Set<ts.ImportDeclaration>();
  tsExports = new Set<ts.ExportDeclaration | ts.ExportAssignment>();
  tsModules = new Set<ts.ModuleDeclaration>();

  constructor(
    private sourceFile: ts.SourceFile,
    private analyzer: Analyzer
  ) {
    const id = analyzer.getRelativePath(sourceFile.fileName);
    const idPathSplit = id.split(path.sep);
    this.code = {
      id: analyzer.getRelativePath(sourceFile.fileName),
      type: NodeEnum.Code,
      name: idPathSplit[idPathSplit.length - 1],
      depth: idPathSplit.length - 1,
      isExternalFile: analyzer.isExternalFile(sourceFile),
      kind: ts.ScriptKind[sourceFile['scriptKind'] as number] as keyof typeof ts.ScriptKind,
      loc: sourceFile.getLineAndCharacterOfPosition(sourceFile.end).line + 1,
      linesShape: this.calculateLinesShape(),
      imports: [],
      definitions: []
    };
  }

  private calculateLinesShape(): number[] {
    const lineStarts = this.sourceFile.getLineStarts();
    const text = this.sourceFile.text;
    const shape: number[] = [];

    const isWhitespace = (ch: string) => ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';

    for (let line = 0; line < lineStarts.length; line++) {
      let lineStart = lineStarts[line];
      let lineEnd = line + 1 < lineStarts.length ? lineStarts[line + 1] : text.length;
      // omit trailing whitespace (line breaks included)
      while (lineEnd > lineStart && isWhitespace(text[lineEnd - 1])) {
        lineEnd--;
      }
      // omit leading whitespace, so start points at the first real char on the line
      while (lineStart < lineEnd && isWhitespace(text[lineStart])) {
        lineStart++;
      }
      // convert absolute offsets to per-line character positions (0 = first column on the left)
      const start = this.sourceFile.getLineAndCharacterOfPosition(lineStart).character;
      const end = this.sourceFile.getLineAndCharacterOfPosition(lineEnd).character;
      shape.push(start, end);
    }

    return shape;
  }

  buildDefinitions() {
    if (this.code.name === 'next.config.js') {
      console.log('wtf');
    }
    this.sourceFile.statements.forEach((node) => {
      this.pullStatement(node);
    });
    this.pullModulesDeclarations();
  }

  buildImports(graph: Map<IdPath, CodeFileBuilder>) {
    if (this.code.isExternalFile) {
      return; // skip imports in files inside node_modules
    }

    this.tsImports.forEach((node) => {
      const { resolvedPath, isExternal } = this.analyzer.getResolvedImportPath(node);

      if (isExternal) {
        // node modules
        // const src = this.analyzer.getSourceFileFromImport(node.moduleSpecifier);
        // if (src) this.externalReferencedFiles.add({ file: src.file, packageName: resolvedPath });
        // else console.warn(`Cannot locate file for external import: ${node.moduleSpecifier['text']}`);
      }

      if (!node.importClause) {
        // this.fileEmptyImports.push(EmptyImportFactory(node, this.analyzer));
        return;
      }
      const fromNode = graph.get(resolvedPath);
      if (!fromNode) {
        console.error(`Attempt to import file that's not registered: ${resolvedPath} from: ${this.code.id}`);
      } else {
        this.code.imports.push(...ImportFactory(node, this.analyzer, fromNode));
      }
    });
  }

  buildExports(graph: Map<IdPath, CodeFileBuilder>) {
    this.tsExports.forEach((node, idx) => {
      const depth = this.code.depth + 1;

      if (ts.isExportAssignment(node)) {
        // export default [1,2,3] (always with 'default' keyword)
        // if (ts.isIdentifier(node.expression)) {
        //   const foundAliasPath = this.analyzer.findIdentifierAliasImportPath(node.expression);
        //   if (foundAliasPath) {
        //     this.addReExport(node, foundAliasPath.resolvedPath, foundAliasPath.isExternal);
        //     return;
        //   }
        // }
        const declaration = DeclarationFactory(
          node.expression as any,
          this.analyzer,
          IO.separator + this.code.id,
          depth
        );
        this.code.definitions.push(declaration);
        return;
      }

      if (ts.isExportDeclaration(node)) {
        // todo ts overload, for now ignore
        // const isNameDuplicated = this.code.definitions.find((e) => e.name === declaration.name);
        // if (!isNameDuplicated) this.code.definitions.push(declaration);

        if (node.exportClause) {
          if (node.exportClause.kind === ts.SyntaxKind.NamespaceExport) {
            // export * as x from './'
            // const { resolvedPath, isExternal } = this.analyzer.getResolvedImportPath(node);
            // this.addReExport(node.exportClause, resolvedPath, isExternal);
            return;
          }
          // SyntaxKind.NamedExports
          node.exportClause.elements.forEach((element) => {
            const isReExporting = !!element.parent.parent.moduleSpecifier;
            if (isReExporting) {
              // const { resolvedPath, isExternal } = this.analyzer.getResolvedImportPath(element.parent.parent);
              // this.addReExport(element, resolvedPath, isExternal);
            }
            if (!ts.isIdentifier(element.name)) {
              throw new Error(`Expected ExportSpecifier name to be Identifier, got: ${element.name.text}`);
            }
            const declaration = DeclarationFactory(element, this.analyzer, IO.separator + this.code.id, depth);
            this.code.definitions.push(declaration);
            // const alias = this.analyzer.findIdentifierAliasImportPath(element.name);
            // if (alias) this.addReExport(element, alias.resolvedPath, alias.isExternal);
            // else this.addExport(element);
          });
        } else {
          // export * from "foo"
          // const { resolvedPath, isExternal } = this.analyzer.getResolvedImportPath(node);
          // this.addReExport(node, resolvedPath, isExternal);
        }
      }
    });
  }

  private pullStatement(node: ts.Statement | ts.Node): void {
    if (ts.isModuleDeclaration(node)) {
      this.tsModules.add(node);
      return;
    }

    if (ts.isImportDeclaration(node)) {
      this.tsImports.add(node);
      return;
    }

    if (ts.isExportDeclaration(node)) {
      this.tsExports.add(node);
      return;
    }

    if (ts.isExportAssignment(node)) {
      this.tsExports.add(node);
      return;
    }

    if (ts.isArrayBindingPattern(node) || ts.isObjectBindingPattern(node)) {
      // const [one] = [1,2]
      // const { d } = obj;

      // const init = d.initializer;
      // const identifier = d.name;
      // const alias = init && ts.isIdentifier(init) && this.analyzer.findIdentifierAliasImportPath(init);
      // if (alias) this.addReExport(identifier, alias.resolvedPath, alias.isExternal);
      const stack: (ts.ObjectBindingPattern | ts.ArrayBindingPattern)[] = [node];
      while (stack.length) {
        const item = stack.pop()!;
        item.elements.forEach((el) => {
          if (el.kind !== ts.SyntaxKind.BindingElement) return;
          if (
            el.name.kind === ts.SyntaxKind.ArrayBindingPattern ||
            el.name.kind === ts.SyntaxKind.ObjectBindingPattern
          ) {
            stack.push(el.name);
            return;
          }
          const declaration = DeclarationFactory(
            el.name,
            this.analyzer,
            IO.separator + this.code.id,
            this.code.depth + 1
          );
          this.code.definitions.push(declaration);
        });
      }
    }

    if (ts.isVariableStatement(node)) {
      // export const a = ..., b = ...;
      // const isExport = node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      node.declarationList.declarations.forEach((d) => {
        this.pullStatement(d.initializer || d.name);
      });
      return;
    }

    // if (
    //   ts.isClassDeclaration(node) ||
    //   ts.isFunctionDeclaration(node) ||
    //   ts.isEnumDeclaration(node) ||
    //   ts.isInterfaceDeclaration(node) ||
    //   ts.isTypeAliasDeclaration(node) ||
    //   ts.isArrowFunction(node) ||
    //   ts.isCallExpression(node) ||
    //   ts.isObjectLiteralExpression(node)
    // )
    const declaration = DeclarationFactory(
      node as TsNode,
      this.analyzer,
      IO.separator + this.code.id,
      this.code.depth + 1
    );
    this.code.definitions.push(declaration);
    // console.warn(`Export not found, skipping: ${SyntaxKind[node.kind]}`);
  }

  private pullModulesDeclarations() {
    // recursively pull all modules (modules can be nested)
    const modulesStack = Array.from(this.tsModules);
    while (modulesStack.length) {
      const module = modulesStack.pop()!;
      const symbol = this.analyzer.getSymbol(module);
      if (!symbol || !module.body || !ts.isModuleBlock(module.body)) continue;

      if (symbol.valueDeclaration && symbol.declarations && symbol.declarations.length > 1) continue; // todo its augmentation

      // todo no recursion for now
      // module.body.statements.forEach(statement => {
      //   if (isModuleDeclaration(statement))
      //     modulesStack.push(statement);
      //   else
      //     this.pullStatementExportImport(statement, analyzer);
      // });
      // todo remove
      const moduleExports = this.analyzer.getTopExportsFromFile(module);
      for (let i = 0; i < moduleExports.length; i++) {
        this.pullStatement(moduleExports[i] as ts.Statement);
      }
    }
  }

  toJson(): CodeFile {
    return this.code;
  }

  /*buildReExports(graph: Map<IdPath, CodeFileBuilder>): void {
    if (this.recalculateAgain) {
      this.unprocessedReexportReferences = this.getUniqueReExportedFiles();
      this.recalculateAgain = false;
    }
    if (!this.unprocessedReexportReferences.length || this.isExternalFile){
      // TODO support external files
      return;
    }
    const stack: IdPath[] = [];
    stack.splice(0, stack.length);
    stack.push(this.id, ...this.unprocessedReexportReferences);

    while (stack.length) {
      const item = graph.get(stack[stack.length - 1])!;
      if (!item) {
        console.error(`Referencing file that was skipped: ${stack[stack.length - 1]} from: ${this.id}`);
        stack.pop();
        continue;
      }

      if (!item.unprocessedReexportReferences.length) {
        stack.pop(); // refs processed, going back to previous node in stack
        item.areReferencesResolved = !item.recalculateAgain;
        if (item.areReferencesResolved)
          item.cachedReExports.forEach((reexport) => {
            const fromNode = graph.get(reexport.fromGraphNode);
            if (!fromNode) console.error(`Referencing file that was skipped: ${reexport.fromGraphNode}`);
            else item.fileReExports.push(...ReexportFactory(reexport, this.analyzer, fromNode));
          });
        continue;
      }

      const ref = item.unprocessedReexportReferences.pop()!;
      if (!graph.get(ref) || graph.get(ref)!.areReferencesResolved)
        // if reference was skipped or already resolved, skip
        continue;

      const isCircularDependency = stack.includes(ref);
      if (isCircularDependency)
        stack.forEach((s, idx) => {
          // mark all (except first in stack) as recalculateAgain
          if (idx > 0) graph.get(s)!.recalculateAgain = true;
        });
      else stack.push(ref); // push to processing if not circular dependency
    }
  }*/
}

// export type CacheReExportItem = {
//   fromGraphNode: IdPath;
//   isExternal: boolean;
//   node:
//     | ExportSpecifier // { A }
//     | Identifier // (variable) const X = FromImport todo can be part of chain, resolve alias always
//     | NamespaceExport // * as X
//     | ExportDeclaration // * from '..'
//     | ExportAssignment; // export default X;
// };

// export class CodeFileCache {
//   // using map to detect duplicates
//   // cachedImports = new Map<ImportDeclaration, CacheImportItem>();
//   // cachedExports = new Map<CacheExportItem['node'], CacheExportItem>();
//   // cachedReExports = new Map<CacheReExportItem['node'], CacheReExportItem>();
//   // packageName is referenced name for this external file, like @angular/core where filePath is /node_modules/@angular/...
//   // externalReferencedFiles = new Set<{ file: SourceFile; packageName: IdPath }>();
//
//   constructor(private analyzer: Analyzer) {}
//
//   // getUniqueReExportedFiles(): IdPath[] {
//   //   const set = new Set<IdPath>();
//   //   this.cachedReExports.forEach((r) => set.add(r.fromGraphNode));
//   //   return Array.from(set.values());
//   // }
//
//   addExport(node: CacheExportItem['node']): void {
//     const item: CacheExportItem = {
//       node
//     };
//     if (this.cachedExports.has(item.node)) {
//       // console.error(`Duplicate export cache item: ${this.analyzer.debugPrettyPrint(item.node)}`);
//     }
//     this.cachedExports.set(item.node, item);
//   }
//
//   addImport(node: ImportDeclaration, resolvedPath: IdPath, isExternal: boolean): void {
//     const item: CacheImportItem = {
//       isExternal,
//       resolvedPath,
//       node
//     };
//     if (this.cachedImports.has(item.node)) {
//       // console.error(`Duplicate import cache item: ${this.analyzer.debugPrettyPrint(item.node)}`);
//     }
//     this.cachedImports.set(item.node, item);
//
//     if (isExternal) {
//       const src = this.analyzer.getSourceFileFromImport(node.moduleSpecifier);
//       if (src) this.externalReferencedFiles.add({ file: src.file, packageName: resolvedPath });
//       else console.warn(`Cannot locate file for external import: ${node.moduleSpecifier['text']}`);
//     }
//   }
//
//   addReExport(node: CacheReExportItem['node'], fromGraphNode: IdPath, isExternal: boolean): void {
//     const item: CacheReExportItem = {
//       node,
//       fromGraphNode,
//       isExternal
//     };
//     if (this.cachedReExports.has(item.node)) {
//       // console.error(`Duplicate reExport cache item: ${this.analyzer.debugPrettyPrint(item.node)}`);
//     }
//     this.cachedReExports.set(item.node, item);
//
//     // calculate external referenced files (if reexporting from external)
//     if (!isExternal) return;
//
//     let file: SourceFile | undefined;
//     switch (node.kind) {
//       case SyntaxKind.ExportSpecifier:
//         file = this.analyzer.getSourceFileFromImport(node.parent.parent.moduleSpecifier)?.file;
//         break;
//       case SyntaxKind.Identifier: {
//         const alias = this.analyzer.resolveAliasedNode(node);
//         if (isImportSpecifier(alias))
//           file = this.analyzer.getSourceFileFromImport(alias.parent.parent.parent.moduleSpecifier)?.file;
//         break;
//       }
//       case SyntaxKind.NamespaceExport:
//         file = this.analyzer.getSourceFileFromImport(node.parent.moduleSpecifier)?.file;
//         break;
//       case SyntaxKind.ExportDeclaration:
//         file = this.analyzer.getSourceFileFromImport(node.moduleSpecifier)?.file;
//         break;
//       case SyntaxKind.ExportAssignment: {
//         const alias = this.analyzer.resolveAliasedNode(node.expression as Identifier);
//         if (isImportSpecifier(alias))
//           file = this.analyzer.getSourceFileFromImport(alias.parent.parent.parent.moduleSpecifier)?.file;
//         break;
//       }
//     }
//     if (file) this.externalReferencedFiles.add({ file, packageName: fromGraphNode });
//     else console.warn(`Cannot locate file for external reexport: ${fromGraphNode}}`);
//   }
// }
