import {
  AsExpression,
  CallExpression,
  ClassDeclaration,
  EnumDeclaration,
  ExportAssignment,
  ExportDeclaration,
  ExportSpecifier,
  FunctionDeclaration,
  Identifier,
  ImportDeclaration,
  InterfaceDeclaration,
  isImportSpecifier,
  NamespaceExport,
  ObjectLiteralExpression,
  SourceFile,
  SyntaxKind,
  TypeAliasDeclaration,
} from 'typescript';
import { IdPath } from '../../analyzer/analyzer.type';
import { Analyzer } from '../../analyzer/analyzer';

export type CacheExportItem = {
  node:
    | Identifier // from VariableDeclaration
    | ExportSpecifier
    | ObjectLiteralExpression
    | ClassDeclaration
    | FunctionDeclaration
    | InterfaceDeclaration
    | EnumDeclaration
    | TypeAliasDeclaration
    | CallExpression
    | AsExpression;
};

export type CacheReExportItem = {
  fromGraphNode: IdPath;
  isExternal?: true;
  node:
    | ExportSpecifier // { A }
    | Identifier // (variable) const X = FromImport todo can be part of chain, resolve alias always
    | NamespaceExport // * as X
    | ExportDeclaration // * from '..'
    | ExportAssignment; // export default X;
};

type CacheImportItem = {
  isExternal?: true;
  resolvedPath: string;
  node: ImportDeclaration;
};

export class CodeFileCache {
  // using map to detect duplicates
  cachedImports = new Map<ImportDeclaration, CacheImportItem>();
  cachedExports = new Map<CacheExportItem['node'], CacheExportItem>();
  cachedReExports = new Map<CacheReExportItem['node'], CacheReExportItem>();
  // packageName is referenced name for this external file, like @angular/core where filePath is /node_modules/@angular/...
  externalReferencedFiles = new Set<{ file: SourceFile, packageName: IdPath }>();

  constructor(private analyzer: Analyzer) {}

  getUniqueReExportedFiles(): IdPath[] {
    const set = new Set<IdPath>();
    this.cachedReExports.forEach(r => set.add(r.fromGraphNode));
    return Array.from(set.values());
  }

  addExport(node: CacheExportItem['node']): void {
    const item: CacheExportItem = {
      node,
    };
    if (this.cachedExports.has(item.node)) {
      // console.error(`Duplicate export cache item: ${this.analyzer.debugPrettyPrint(item.node)}`);
    }
    this.cachedExports.set(item.node, item);
  }

  addImport(node: ImportDeclaration, resolvedPath: IdPath, isExternal?: true): void {
    const item: CacheImportItem = {
      isExternal,
      resolvedPath,
      node,
    };
    if (this.cachedImports.has(item.node)) {
      // console.error(`Duplicate import cache item: ${this.analyzer.debugPrettyPrint(item.node)}`);
    }
    this.cachedImports.set(item.node, item);

    if (isExternal) {
      const src = this.analyzer.getSourceFileFromImport(node.moduleSpecifier);
      if (src) this.externalReferencedFiles.add({ file: src.file, packageName: resolvedPath });
      else console.warn(`Cannot locate file for external import: ${node.moduleSpecifier['text']}`);
    }
  }

  addReExport(node: CacheReExportItem['node'], fromGraphNode: IdPath, isExternal?: true): void {
    const item: CacheReExportItem = {
      node,
      fromGraphNode,
      isExternal,
    };
    if (this.cachedReExports.has(item.node)) {
      // console.error(`Duplicate reExport cache item: ${this.analyzer.debugPrettyPrint(item.node)}`);
    }
    this.cachedReExports.set(item.node, item);

    // calculate external referenced files (if reexporting from external)
    if (!isExternal) return;

    let file: SourceFile | undefined;
    switch (node.kind) {
      case SyntaxKind.ExportSpecifier:
        file = this.analyzer.getSourceFileFromImport(node.parent.parent.moduleSpecifier)?.file;
        break;
      case SyntaxKind.Identifier: {
        const alias = this.analyzer.resolveAliasedNode(node);
        if (isImportSpecifier(alias))
          file = this.analyzer.getSourceFileFromImport(alias.parent.parent.parent.moduleSpecifier)?.file;
        break;
      }
      case SyntaxKind.NamespaceExport:
        file = this.analyzer.getSourceFileFromImport(node.parent.moduleSpecifier)?.file;
        break;
      case SyntaxKind.ExportDeclaration:
        file = this.analyzer.getSourceFileFromImport(node.moduleSpecifier)?.file;
        break;
      case SyntaxKind.ExportAssignment: {
        const alias = this.analyzer.resolveAliasedNode(node.expression as Identifier);
        if (isImportSpecifier(alias))
          file = this.analyzer.getSourceFileFromImport(alias.parent.parent.parent.moduleSpecifier)?.file;
        break;
      }
    }
    if (file) this.externalReferencedFiles.add({ file, packageName: fromGraphNode });
    else console.warn(`Cannot locate file for external reexport: ${fromGraphNode}}`);
  }
}
