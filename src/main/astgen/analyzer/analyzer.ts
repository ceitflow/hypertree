import ts, {
  CallExpression,
  createSourceFile,
  ExportDeclaration,
  Expression,
  Identifier,
  ImportDeclaration,
  isIdentifier,
  isImportSpecifier,
  ModuleDeclaration,
  Node,
  Program,
  resolveModuleName,
  ScriptTarget,
  SourceFile,
  StringLiteral,
  Symbol,
  SymbolFlags,
  sys,
  TypeChecker,
  TypeFlags,
} from 'typescript';
import { IO } from './io';
import path from 'node:path';
import { IdPath } from '@lib/ast';
import { CategoryType, GroupedTypeFlags } from './analyzer.type';

export class Analyzer {
  private typeCheck: TypeChecker;
  private sourceFileIds: IdPath[] = [];

  constructor(
    private srcPath: string,
    private program: Program
  ) {
    this.typeCheck = program.getTypeChecker();
    this.program.getRootFileNames().forEach(fileName => {
      this.sourceFileIds.push(fileName);
    });
  }

  addSourceFileId(id: IdPath) {
    this.sourceFileIds.push(id);
  }

  getProgramSrcPath() {
    return this.srcPath;
  }

  isExternalFile(sourceFile: SourceFile): boolean {
    return !this.sourceFileIds.find(n => n.endsWith(sourceFile.fileName));
  }

  getSourceFileFromImport(moduleSpecifier?: Expression): { file: SourceFile; notPresentInProgram: boolean } | undefined {
    if (!moduleSpecifier) {
      return undefined;
    }
    const literal = moduleSpecifier as StringLiteral;
    const result = this.typeCheck.getSymbolAtLocation(literal)?.valueDeclaration?.getSourceFile();
    if (result) {
      return { file: result, notPresentInProgram: false };
    }

    // else create SourceFile manually as its not registered in Program for some reason
    // - could be missing .d.ts definitions, and/or the file is .js
    const resolvedFileName = resolveModuleName(
      literal.text,
      literal.getSourceFile().fileName,
      this.program.getCompilerOptions(),
      sys
    ).resolvedModule?.resolvedFileName;

    if (resolvedFileName !== undefined) {
      const file = createSourceFile(resolvedFileName, IO.readSourceFile(resolvedFileName), ScriptTarget.Latest, true);
      return { file, notPresentInProgram: true };
    }

    return undefined;
  }

  getRelativePath(filePath: string): string {
    return path.relative(this.srcPath, filePath);
  }

  getResolvedImportPath(node: ImportDeclaration | ExportDeclaration): { resolvedPath: string; isExternal: boolean } {
    const relativePath = (node.moduleSpecifier as StringLiteral).text;
    const src = this.getSourceFileFromImport(node.moduleSpecifier);
    if (src) {
      const isExternal =
        src.notPresentInProgram ||
        this.program.isSourceFileFromExternalLibrary(src.file) ||
        this.program.isSourceFileDefaultLibrary(src.file);
      return { resolvedPath: isExternal ? relativePath : this.getRelativePath(src.file.fileName), isExternal };
    }
    return { resolvedPath: relativePath, isExternal: false };
  }

  getTopExportsFromFile(file: SourceFile | ModuleDeclaration): Node[] {
    const symbol = this.getSymbol(file);
    if (symbol) {
      const result: Node[] = [];
      this.typeCheck.getExportsOfModule(symbol).forEach(symbol => {
        const node = symbol.valueDeclaration || symbol.declarations?.[0];
        if (node) result.push(node);
      });
      return result;
    }

    return [];
  }

  findIdentifierAliasImportPath(node: Identifier) {
    const alias = this.resolveAliasedNode(node);
    if (isImportSpecifier(alias)) return this.getResolvedImportPath(alias.parent.parent.parent as ImportDeclaration); // todo jsdoc will break this
    return undefined;
  }

  getPathToOriginalNode(node: Identifier): string {
    const absolutePath = this.resolveAliasedNode(node).getSourceFile().fileName;
    return this.getRelativePath(absolutePath);
  }

  getSymbol(node: Node): Symbol | undefined {
    return node['symbol'] || this.typeCheck.getSymbolAtLocation(node);
  }

  resolveAliasedNode(node: Identifier): Node {
    const symbol = this.getSymbol(node);
    if (symbol) {
      // Check if the symbol is an alias
      if (symbol.flags & SymbolFlags.Alias) {
        const aliasedSymbol = this.typeCheck.getAliasedSymbol(symbol);
        const originalDeclaration = aliasedSymbol.valueDeclaration || aliasedSymbol.declarations?.[0];

        if (originalDeclaration) return originalDeclaration;
      }
      // If not an alias, check if the symbol has a declaration with initializer
      const declaration = symbol.valueDeclaration || symbol.declarations?.[0];
      if (declaration) return declaration;
    }
    return node;
  }

  evaluateType(item: Node) {
    const symbol = this.typeCheck.getSymbolAtLocation(isIdentifier(item) ? this.resolveAliasedNode(item) : item);
    if (!symbol) {
      // console.error(`Unable to determine type symbol: ${item['text']}`);
      return;
    }

    const resolvedSymbol = symbol.flags & SymbolFlags.Alias ? this.typeCheck.getAliasedSymbol(symbol) : symbol;
    if (!resolvedSymbol.valueDeclaration) {
      return;
    }
    const type = this.typeCheck.getTypeOfSymbolAtLocation(resolvedSymbol, resolvedSymbol.valueDeclaration);
    // if (!type.symbol)
    //   primitive case
    return this.getTypeFlagCategory(type.flags);
  }

  getCallExpressionDeclaration(node: CallExpression) {
    try {
      // TS can throw on programs that aren't type-sound (missing deps/libs).
      const signature = this.typeCheck.getResolvedSignature(node);
      return signature?.declaration;
    } catch (e) {
      console.warn(`Failed to resolve call signature in ${node.getSourceFile().fileName}: ${(e as Error).message}`);
      return undefined;
    }
  }

  getTypeFlagCategory(itemFlags: TypeFlags): { astType: string; category: CategoryType } {
    for (const [category, flags] of Object.entries(GroupedTypeFlags)) {
      const match = flags.find(f => f === itemFlags);
      if (match) {
        return { astType: TypeFlags[match], category: category as CategoryType };
      }
    }
    return { astType: 'Unknown', category: 'Unknown' };
  }

  getExportDefaultFlags(node: ts.Node): { isExport: boolean; isDefault: boolean } {
    const flags = ts.getCombinedModifierFlags(node as ts.Declaration);
    const isExport = (flags & ts.ModifierFlags.Export) !== 0;
    const isDefault = (flags & ts.ModifierFlags.Default) !== 0;
    return { isExport, isDefault };
  }
}
