import ts from 'typescript';
import { Analyzer } from '../../../analyzer';
import { CodeFileBuilder } from '../code-file-builder';
import { CodeFileImport, DeclarationModifier } from '@lib/ast';

export const EmptyImportFactory = (node: ts.ImportDeclaration, analyzer: Analyzer): CodeFileImport => {
  const { resolvedPath, isExternal } = analyzer.getResolvedImportPath(node);
  // (!node.importClause) No import clause case (e.g., import './side-effects')
  return {
    from: resolvedPath,
    token: 'empty',
    isExternal
  };
};

export const ImportFactory = (
  node: ts.ImportDeclaration,
  analyzer: Analyzer,
  fromNode: CodeFileBuilder
): CodeFileImport[] => {
  const result: CodeFileImport[] = [];
  const importClause = node.importClause;
  const namedBindings = importClause?.namedBindings;
  const { resolvedPath, isExternal } = analyzer.getResolvedImportPath(node);

  if (!importClause) {
    throw new Error('Cannot build import token without "from" path');
  }

  // import default from '..'
  // Note: can be mixed default and named specifiers
  if (importClause.name) {
    result.push({
      from: resolvedPath,
      token: {
        isDefault: true,
        name: node.importClause!.name!.text,
        pathToDeclaration: isExternal ? resolvedPath : analyzer.getPathToOriginalNode(importClause.name)
      },
      isExternal
    });
  }

  // import: import * as name from '..'
  if (namedBindings && ts.isNamespaceImport(namedBindings)) {
    fromNode.code.definitions.forEach((ex) => {
      if (ex.modifier === DeclarationModifier.Export || ex.modifier === DeclarationModifier.Reexport){
        result.push({
          from: resolvedPath,
          token: {
            isDefault: false,
            name: ex.name,
            pathToDeclaration: resolvedPath
          },
          isExternal
        });
      }
    });
  }

  // import { a, b } from '..'
  if (namedBindings && ts.isNamedImports(namedBindings))
    namedBindings.elements.forEach((element) => {
      result.push({
        from: resolvedPath,
        token: {
          isDefault: false,
          name: element.name.text,
          originalName: element.propertyName?.text,
          pathToDeclaration: isExternal ? resolvedPath : analyzer.getPathToOriginalNode(element.name)
        },
        isExternal
      });
    });

  return result;
};
