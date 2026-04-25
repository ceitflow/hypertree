import ts from 'typescript';

export type TsNode =
  | ts.Identifier // from VariableDeclaration
  | ts.ExportSpecifier
  | ts.ObjectLiteralExpression
  | ts.ClassDeclaration
  | ts.FunctionDeclaration
  | ts.ArrowFunction
  | ts.InterfaceDeclaration
  | ts.EnumDeclaration
  | ts.TypeAliasDeclaration
  | ts.CallExpression
  | ts.AsExpression;
