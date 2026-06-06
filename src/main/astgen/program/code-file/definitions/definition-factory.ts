import ts from 'typescript';
import { TsNode } from '../types';
import { Analyzer } from '../../../analyzer';
import { DeclarationEnum, DeclarationModifier, DeclarationNode, IdPath, NodeEnum } from '@lib/ast';

const calculateLoc = (node: TsNode): { startLine: number; endLine: number; loc: number } => {
  const sourceFile = node.getSourceFile();
  const { line: startLine } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  const { line: endLine } = sourceFile.getLineAndCharacterOfPosition(node.end);
  return { startLine, endLine, loc: endLine - startLine + 1 };
};

const createUnknownDeclaration = (id: string, name: string, depth: number): DeclarationNode => ({
  id,
  type: NodeEnum.Declaration,
  name,
  depth,
  loc: 0,
  startLine: 0,
  endLine: 0,
  modifier: DeclarationModifier.None,
  token: {
    category: DeclarationEnum.Unknown,
    type: ''
  }
});

export const DeclarationFactory = (
  node: TsNode,
  analyzer: Analyzer,
  id: IdPath,
  depth: number
): DeclarationNode => {
  const { isExport, isDefault } = analyzer.getExportDefaultFlags(node);
  switch (node.kind) {
    case ts.SyntaxKind.Identifier: {
      const n = node as ts.Identifier;
      return {
        id,
        type: NodeEnum.Declaration,
        modifier: DeclarationModifier.None,
        name: n.text,
        depth,
        ...calculateLoc(n),
        token: {
          category: DeclarationEnum.Primitive,
          type: analyzer.evaluateType(node)?.astType as any // todo might not work without pointing to parent?
        }
      };
    }
    case ts.SyntaxKind.ExportSpecifier: {
      const n = node as ts.ExportSpecifier;
      const originalName = n.propertyName?.text; // defined if 'import { original as alias }'
      return {
        id,
        type: NodeEnum.Declaration,
        modifier: DeclarationModifier.None,
        name: n.name.text,
        depth,
        ...calculateLoc(n),
        token: {
          category: analyzer.evaluateType(node)?.category as any,
          type: analyzer.evaluateType(n.name as ts.Identifier)?.category as any
        }
      };
    }
    case ts.SyntaxKind.ObjectLiteralExpression: {
      const n = node as ts.ObjectLiteralExpression;
      const parentName = (n.parent as ts.NamedDeclaration | undefined)?.name;
      const name = parentName && ts.isIdentifier(parentName) ? parentName.text : '';
      return {
        id,
        type: NodeEnum.Declaration,
        modifier: DeclarationModifier.None,
        name,
        depth,
        ...calculateLoc(n),
        token: {
          category: DeclarationEnum.Object,
          type: 'object'
        }
      };
    }
    case ts.SyntaxKind.ClassDeclaration: {
      const n = node as ts.ClassDeclaration;
      return {
        id,
        type: NodeEnum.Declaration,
        modifier: DeclarationModifier.None,
        name: n.name?.text as string,
        depth,
        ...calculateLoc(n),
        token: {
          category: DeclarationEnum.Class
          // todo metadata extract using analyzer
        }
      };
    }
    case ts.SyntaxKind.FunctionDeclaration: {
      const n = node as ts.FunctionDeclaration;
      return {
        id,
        type: NodeEnum.Declaration,
        modifier: DeclarationModifier.None,
        name: n.name?.text as string,
        depth,
        ...calculateLoc(n),
        token: {
          category: DeclarationEnum.Function,
          async: false,
          generator: false
        }
      };
    }
    case ts.SyntaxKind.ArrowFunction: {
      const n = node as ts.ArrowFunction;
      const name = n.parent.kind === ts.SyntaxKind.VariableDeclaration ? (n.parent as ts.VariableDeclaration).name['text'] || '' : '';
      return {
        id,
        type: NodeEnum.Declaration,
        modifier: DeclarationModifier.None,
        name,
        depth,
        ...calculateLoc(n),
        token: {
          category: DeclarationEnum.Function,
          async: false,
          generator: false
        }
      }
    }
    case ts.SyntaxKind.InterfaceDeclaration: {
      const n = node as ts.InterfaceDeclaration;
      return {
        id,
        type: NodeEnum.Declaration,
        modifier: DeclarationModifier.None,
        name: n.name.text,
        depth,
        ...calculateLoc(n),
        token: {
          category: DeclarationEnum.TsType,
          type: 'interface'
        }
      };
    }
    case ts.SyntaxKind.EnumDeclaration: {
      const n = node as ts.EnumDeclaration;
      return {
        id,
        type: NodeEnum.Declaration,
        modifier: DeclarationModifier.None,
        name: n.name.text,
        depth,
        ...calculateLoc(n),
        token: {
          category: DeclarationEnum.TsType,
          type: 'enum'
        }
      };
    }
    case ts.SyntaxKind.TypeAliasDeclaration: {
      const n = node as ts.TypeAliasDeclaration;
      return {
        id,
        type: NodeEnum.Declaration,
        modifier: DeclarationModifier.None,
        name: n.name.text,
        depth,
        ...calculateLoc(n),
        token: {
          category: DeclarationEnum.TsType,
          type: 'typeAlias'
        }
      };
    }

    // export default defineConfig()
    case ts.SyntaxKind.CallExpression: {
      const n = node as ts.CallExpression;
      // if (!analyzer.getSymbol(n.parent)) {
      //   const literal = ts.SyntaxKind.ObjectLiteralExpression;
      //   // @ts-expect-error missing typescript type on default export, so make it a generic object
      //   n['kind'] = literal;
      //   return DeclarationFactory(n, analyzer, id, depth);
      // }

      const declaration = analyzer.getCallExpressionDeclaration(n);
      if (!declaration) {
        console.error(`Unsupported declaration type: ${ts.SyntaxKind[n['kind']]}`);
        return createUnknownDeclaration(id, '', depth);
      }
      // feed back the return value of call expression
      const returnValue = DeclarationFactory(declaration as any, analyzer, id, depth);
      return {
        id,
        type: NodeEnum.Declaration,
        modifier: DeclarationModifier.None,
        name: (n.parent as ts.VariableDeclaration).name['text'] || returnValue.name,
        depth,
        ...calculateLoc(n),
        token: returnValue.token
      }
    }

    // export default {} as Something;
    case ts.SyntaxKind.AsExpression: {
      const n = node as ts.AsExpression;
      return DeclarationFactory(n.expression as any, analyzer, id, depth);
    }

    // declare const x: <T>(...) => ...;  (bare function/constructor signature type)
    case ts.SyntaxKind.FunctionType:
    case ts.SyntaxKind.ConstructorType: {
      const n = node as ts.FunctionTypeNode | ts.ConstructorTypeNode;
      const parentName = (n.parent as ts.NamedDeclaration | undefined)?.name;
      const name = parentName && ts.isIdentifier(parentName) ? parentName.text : '';
      return {
        id,
        type: NodeEnum.Declaration,
        modifier: DeclarationModifier.None,
        name,
        depth,
        ...calculateLoc(n),
        token: {
          category: DeclarationEnum.Function,
          async: false,
          generator: false
        }
      };
    }

    default: {
      console.error(`Unsupported declaration type: ${ts.SyntaxKind[node['kind']]}`);
      return createUnknownDeclaration(id, '', depth);
    }
  }
};

/*
/*export const ReexportFactory = (
  cached: CacheReExportItem,
  analyzer: Analyzer,
  fromNode: CodeFileBuilder
): CodeFileReExport[] => {
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
          isDefault: false,
          originalName,
          pathToDeclaration: fromGraphNode
        }
      });
      break;
    }
    case SyntaxKind.Identifier: {
      // export const X = FromImport
      result.push({
        from: fromGraphNode, // TODO
        token: {
          isDefault: false,
          name: node.text,
          pathToDeclaration: fromGraphNode
        }
      });
      break;
    }
    case SyntaxKind.NamespaceExport: {
      //  export * as X from '..'
      const { resolvedPath, isExternal } = analyzer.getResolvedImportPath(node.parent);
      fromNode.fileExports.forEach((ex) =>
        result.push({
          from: resolvedPath,
          token: {
            isDefault: false,
            name: ex.name!,
            pathToDeclaration: resolvedPath
          }
        })
      );
      fromNode.fileReExports.forEach((re) =>
        result.push({
          from: resolvedPath,
          token: { ...re.token }
        })
      );
      break;
    }
    case SyntaxKind.ExportDeclaration: {
      // export * from '..' (no alias)
      const { resolvedPath, isExternal } = analyzer.getResolvedImportPath(node);
      fromNode.fileExports.forEach((ex) =>
        result.push({
          from: resolvedPath,
          token: {
            isDefault: false,
            name: ex.name!,
            pathToDeclaration: resolvedPath
          }
        })
      );
      fromNode.fileReExports.forEach((re) =>
        result.push({
          from: resolvedPath,
          token: { ...re.token }
        })
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
          pathToDeclaration: fromGraphNode
        }
      });
      break;
    }
  }
  return result;
};*/
