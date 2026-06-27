import ts from 'typescript';

export type TsNode =
  | ts.Identifier // from VariableDeclaration
  | ts.ExportSpecifier
  | ts.ClassDeclaration
  | ts.FunctionDeclaration
  | ts.ArrowFunction
  | ts.InterfaceDeclaration
  | ts.EnumDeclaration
  | ts.TypeAliasDeclaration
  | ts.CallExpression
  | ts.AsExpression
  | ts.FunctionTypeNode
  | ts.ConstructorTypeNode
  // value expressions from a variable initializer (const x = <value>)
  | ts.ObjectLiteralExpression
  | ts.ArrayLiteralExpression
  | ts.StringLiteral
  | ts.NumericLiteral
  | ts.BigIntLiteral
  | ts.NoSubstitutionTemplateLiteral
  | ts.TemplateExpression
  | ts.RegularExpressionLiteral
  | ts.TrueLiteral
  | ts.FalseLiteral
  | ts.NullLiteral
  | ts.FunctionExpression
  | ts.NewExpression
  | ts.PropertyAccessExpression
  | ts.ElementAccessExpression;
