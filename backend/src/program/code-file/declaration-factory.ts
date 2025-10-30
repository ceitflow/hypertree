import {
  CallExpression,
  AsExpression,
  ClassDeclaration,
  EnumDeclaration,
  ExportSpecifier,
  FunctionDeclaration,
  Identifier,
  ImportDeclaration,
  InterfaceDeclaration,
  isNamedImports,
  isNamespaceImport,
  ObjectLiteralExpression,
  SyntaxKind,
  TypeAliasDeclaration,
} from 'typescript';
import { Analyzer } from '../../analyzer/analyzer';
import { CodeFileBuilder } from './code-file-builder';
import { CacheExportItem, CacheReExportItem } from './code-file-cache';
import { DeclarationEnum, DeclarationNode } from './declaration.type';
import { CodeFileEmptyImport, CodeFileImport, CodeFileReExport } from './code-file.type';

// create Export, Import and Reexport types from TS Nodes
export const ExportFactory = (node: CacheExportItem['node'], analyzer: Analyzer): DeclarationNode | undefined => {
  switch (node.kind) {
    case SyntaxKind.Identifier: {
      const n = node as Identifier;
      return {
        name: n.text,
        loc: calculateLoc(n),
        referencedImportTokens: [],
        token: {
          category: DeclarationEnum.Primitive,
          type: analyzer.evaluateType(node)?.astType as any, // todo might not work without pointing to parent?
        },
      }
    }
    case SyntaxKind.ExportSpecifier: {
      const n = node as ExportSpecifier;
      return {
        name: n.name.text,
        loc: calculateLoc(n),
        referencedImportTokens: [],
        token: {
          category: analyzer.evaluateType(node)?.category as any,
          type: analyzer.evaluateType(n.name as Identifier)?.category as any,
        },
      }
    }
    case SyntaxKind.ObjectLiteralExpression: {
      const n = node as ObjectLiteralExpression;
      return {
        name: '_',
        loc: calculateLoc(n),
        referencedImportTokens: [],
        token: {
          category: DeclarationEnum.Object,
          type: 'object',
        },
      }
    }
    case SyntaxKind.ClassDeclaration: {
      const n = node as ClassDeclaration;
      return {
        name: n.name?.text as string,
        loc: calculateLoc(n),
        referencedImportTokens: [],
        token: {
          category: DeclarationEnum.Class,
          // todo metadata extract using analyzer
        },
      }
    }
    case SyntaxKind.FunctionDeclaration: {
      const n = node as FunctionDeclaration;
      return {
        name: n.name?.text as string,
        loc: calculateLoc(n),
        referencedImportTokens: [],
        token: {
          category: DeclarationEnum.Function,
        },
      }
    }
    case SyntaxKind.InterfaceDeclaration: {
      const n = node as InterfaceDeclaration;
      return {
        name: n.name.text,
        loc: calculateLoc(n),
        referencedImportTokens: [],
        token: {
          category: DeclarationEnum.TsType,
          type: 'interface',
        },
      }
    }
    case SyntaxKind.EnumDeclaration: {
      const n = node as EnumDeclaration;
      return {
        name: n.name.text,
        loc: calculateLoc(n),
        referencedImportTokens: [],
        token: {
          category: DeclarationEnum.TsType,
          type: 'enum',
        },
      }
    }
    case SyntaxKind.TypeAliasDeclaration: {
      const n = node as TypeAliasDeclaration;
      return {
        name: n.name.text,
        loc: calculateLoc(n),
        referencedImportTokens: [],
        token: {
          category: DeclarationEnum.TsType,
          type: 'typeAlias',
        },
      }
    }

    // export default defineConfig()
    case SyntaxKind.CallExpression: {
      const n = node as CallExpression;
      const declaration = analyzer.getCallExpressionDeclaration(n);
      if (!declaration) {
        console.error(`Unsupported declaration type: ${SyntaxKind[n['kind']]}`);
        return;
      }
      return ExportFactory(declaration as any, analyzer); // feed back the return value of call expression
    }

    // export default {} as Something;
    case SyntaxKind.AsExpression: {
      const n = node as AsExpression;
      return ExportFactory(n.expression as any, analyzer);
    }

    default:
      console.error(`Unsupported declaration type: ${SyntaxKind[node['kind']]}`);
  }
}

const calculateLoc = (node: CacheExportItem['node']): number => {
  const sourceFile = node.getSourceFile();
  const { line: startLine } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  const { line: endLine } = sourceFile.getLineAndCharacterOfPosition(node.end);
  return endLine - startLine + 1;
}

export const EmptyImportFactory = (node: ImportDeclaration, analyzer: Analyzer): CodeFileEmptyImport => {
  const { resolvedPath, isExternal } = analyzer.getResolvedImportPath(node);
  // (!node.importClause) No import clause case (e.g., import './side-effects')
  return {
    type: 'empty',
    from: resolvedPath,
    isExternal,
  }
}

export const ImportFactory = (node: ImportDeclaration, analyzer: Analyzer, fromNode: CodeFileBuilder): CodeFileImport[] => {
  const result: CodeFileImport[] = [];
  const importClause = node.importClause;
  const namedBindings = importClause?.namedBindings;
  const { resolvedPath, isExternal } = analyzer.getResolvedImportPath(node);

  if (!importClause) {
    throw new Error("Cannot build import token without from path");
  }

  // import default from '..'
  // Note: can be mixed default and named specifiers
  if (importClause.name) {
    result.push({
      from: resolvedPath,
      token: {
        isDefault: true,
        name: node.importClause!.name!.text,
        pathToDeclaration: isExternal ? resolvedPath : analyzer.getPathToOriginalNode(importClause.name),
      },
      isExternal,
    });
  }

  // import: import * as name from '..'
  if (namedBindings && isNamespaceImport(namedBindings)) {
    fromNode.fileExports.forEach(ex =>
        result.push({
          from: resolvedPath,
          token: {
            name: ex.name,
            pathToDeclaration: resolvedPath,
          },
          isExternal,
        }),
    );
    fromNode.fileReExports.forEach(re =>
        result.push({
          from: resolvedPath,
          token: { ...re.token },
          isExternal,
        }),
    );
  }

  // import { a, b } from '..'
  if (namedBindings && isNamedImports(namedBindings))
    namedBindings.elements.forEach(element => {
      result.push({
        from: resolvedPath,
        token: {
          name: element.name.text,
          originalName: element.propertyName?.text,
          pathToDeclaration: isExternal ? resolvedPath : analyzer.getPathToOriginalNode(element.name),
        },
        isExternal,
      });
    });

  return result;
}

export const ReexportFactory = (cached: CacheReExportItem, analyzer: Analyzer, fromNode: CodeFileBuilder): CodeFileReExport[] => {
  const { node, fromGraphNode } = cached;
  const result: CodeFileReExport[] = [];

  switch (node.kind) {
    case SyntaxKind.ExportSpecifier: {
      // export { X } from '../'
      const name = node.name.text;
      const originalName = node.propertyName?.text; // defined if 'import { original as alias }'
      const { resolvedPath, isExternal } = analyzer.getResolvedImportPath(node.parent.parent);
      result.push({
        from: resolvedPath,
        token: {
          name,
          originalName,
          pathToDeclaration: fromGraphNode,
        },
      });
      break;
    }
    case SyntaxKind.Identifier: {
      // export const X = FromImport
      result.push({
        from: fromGraphNode, // TODO
        token: {
          name: node.text,
          pathToDeclaration: fromGraphNode,
        },
      });
      break;
    }
    case SyntaxKind.NamespaceExport: {
      //  export * as X from '..'
      const { resolvedPath, isExternal } = analyzer.getResolvedImportPath(node.parent);
      fromNode.fileExports.forEach(ex =>
          result.push({
            from: resolvedPath,
            token: {
              name: ex.name!,
              pathToDeclaration: resolvedPath,
            },
          }),
      );
      fromNode.fileReExports.forEach(re =>
          result.push({
            from: resolvedPath,
            token: { ...re.token },
          }),
      );
      break;
    }
    case SyntaxKind.ExportDeclaration: {
      // export * from '..' (no alias)
      const { resolvedPath, isExternal } = analyzer.getResolvedImportPath(node);
      fromNode.fileExports.forEach(ex =>
          result.push({
            from: resolvedPath,
            token: {
              name: ex.name!,
              pathToDeclaration: resolvedPath,
            },
          }),
      );
      fromNode.fileReExports.forEach(re =>
          result.push({
            from: resolvedPath,
            token: { ...re.token },
          }),
      );
      break;
    }
    case SyntaxKind.ExportAssignment: {
      // export default X;
      result.push({
        from: fromGraphNode,
        token: {
          isDefault: true,
          name: node.name?.text as string,
          pathToDeclaration: fromGraphNode,
        },
      });
      break;
    }
  }
  return result;
}
