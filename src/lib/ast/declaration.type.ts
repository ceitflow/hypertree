import { NodeEnum, BaseNode } from './id.type';

export enum DeclarationModifier {
  None,
  Export,
  Reexport
}

export type DeclarationNode = BaseNode<NodeEnum.Declaration> & {
  loc: number;
  startLine: number;
  endLine: number;
  // referencedImportTokens: string[];
  modifier: DeclarationModifier;
  token:
    | DeclarationClass
    | DeclarationFunction
    | DeclarationPrimitive
    | DeclarationTSType
    | DeclarationObject
    | DeclarationUnknown;
};

export type DeclarationClass = {
  category: DeclarationEnum.Class;
  superClass?: string;
  implements?: string[];
  methods?: DeclarationFunction[];
  properties?: string[];
};

export type DeclarationFunction = {
  category: DeclarationEnum.Function;
  properties?: (DeclarationFunction | DeclarationPrimitive | DeclarationObject)[];
  params?: string[];
  async: boolean;
  generator: boolean;
  // pure: boolean
};

export type DeclarationPrimitive = {
  category: DeclarationEnum.Primitive;
  type: PrimitiveEnum;
};

export type DeclarationTSType = {
  category: DeclarationEnum.TsType;
  type: 'interface' | 'typeAlias' | 'enum';
};

export type DeclarationObject = {
  category: DeclarationEnum.Object;
  type: any;
};

export type DeclarationUnknown = {
  // fallback
  category: DeclarationEnum.Unknown;
  type: string;
};

export enum DeclarationEnum {
  Class = 'class',
  Function = 'function',
  Primitive = 'primitive',
  TsType = 'tsType',
  Object = 'object',
  Unknown = 'unknown'
}

export enum PrimitiveEnum {
  Undefined,
  Null,
  Boolean,
  Number,
  BigInt,
  String,
  Symbol,
  Array
}
