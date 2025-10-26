import {
  createPrinter,
  EmitHint,
  ExportDeclaration,
  Expression,
  Identifier,
  ImportDeclaration,
  isIdentifier,
  isImportSpecifier,
  ModuleDeclaration,
  NewLineKind,
  Node,
  Program,
  SourceFile,
  StringLiteral,
  Symbol,
  SymbolFlags,
  TypeChecker,
} from 'typescript';
import path from 'node:path';
import { TypeAnalyzer } from './type-analyzer';

// 1. getPath
// 2. getType
// 3. getRealNodeFromAlias
export class Analyzer {
  private typeCheck: TypeChecker;
  private typeAnalyzer = new TypeAnalyzer();

  constructor(private srcPath: string, private program: Program) {
    this.typeCheck = program.getTypeChecker();
  }

  getProgramSrcPath = () => this.srcPath;

  isExternalFile(sourceFile: SourceFile): boolean {
    return !this.program.getRootFileNames().find(n => n.endsWith(sourceFile.fileName));
  }

  getSourceFileFromImport(moduleSpecifier?: Expression): SourceFile | undefined {
    if (!moduleSpecifier)
      return undefined;

    return this.typeCheck.getSymbolAtLocation(moduleSpecifier as StringLiteral)?.valueDeclaration?.getSourceFile();
  }

  getRelativePath(filePath: string): string {
    return path.relative(this.srcPath, filePath);
  }

  getResolvedImportPath(node: ImportDeclaration | ExportDeclaration): { resolvedPath: string, isExternal?: true } {
    const relativePath = (node.moduleSpecifier as StringLiteral).text;
    const file = this.getSourceFileFromImport(node.moduleSpecifier);
    if (file) {
      const isExternal = this.program.isSourceFileFromExternalLibrary(file) || this.program.isSourceFileDefaultLibrary(file) || undefined;
      return { resolvedPath: isExternal ? relativePath : this.getRelativePath(file.fileName), isExternal }
    }
    return { resolvedPath: relativePath };
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
    if (isImportSpecifier(alias))
      return this.getResolvedImportPath(alias.parent.parent.parent as ImportDeclaration); // todo jsdoc will break this
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

        if (originalDeclaration)
          return originalDeclaration;
      }
      // If not an alias, check if the symbol has a declaration with initializer
      const declaration = symbol.valueDeclaration || symbol.declarations?.[0];
      if (declaration)
        return declaration;
    }
    return node;
  }

  evaluateType(item: Node) {
    const symbol = this.typeCheck.getSymbolAtLocation(isIdentifier(item) ? this.resolveAliasedNode(item) : item);
    if (!symbol) {
      // console.error(`Unable to determine type symbol: ${item['text']}`);
      return;
    }

    const resolvedSymbol = (symbol.flags & SymbolFlags.Alias) ? this.typeCheck.getAliasedSymbol(symbol) : symbol;
    if (!resolvedSymbol.valueDeclaration)
      return;

    const type = this.typeCheck.getTypeOfSymbolAtLocation(resolvedSymbol, resolvedSymbol.valueDeclaration);
    // if (!type.symbol)
    //   primitive case
    return this.typeAnalyzer.getTypeFlagCategory(type.flags);
  }

  debugPrettyPrint(node: Node): string {
    return createPrinter({
      newLine: NewLineKind.LineFeed,
      removeComments: true,
      noEmitHelpers: true,
      omitTrailingSemicolon: true
    }).printNode(EmitHint.Unspecified, node, node.getSourceFile()).split('\n')[0];
  }
}
