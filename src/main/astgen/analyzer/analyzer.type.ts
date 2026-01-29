import { TypeFlags } from 'typescript';

export const GroupedTypeFlags = {
  Unknown: [TypeFlags.Any, TypeFlags.Unknown],
  Boolean: [TypeFlags.Boolean, TypeFlags.BooleanLiteral, TypeFlags.BooleanLike],
  Number: [TypeFlags.Number, TypeFlags.NumberLiteral, TypeFlags.NumberLike],
  String: [TypeFlags.String, TypeFlags.StringLiteral, TypeFlags.StringLike, TypeFlags.StringOrNumberLiteral],
  Symbol: [TypeFlags.ESSymbol, TypeFlags.UniqueESSymbol, TypeFlags.ESSymbolLike],
  BigInt: [TypeFlags.BigInt, TypeFlags.BigIntLiteral, TypeFlags.BigIntLike],
  Enum: [TypeFlags.Enum, TypeFlags.EnumLiteral, TypeFlags.EnumLike],
  Object: [TypeFlags.Object, TypeFlags.NonPrimitive],
  CompositeTypes: [TypeFlags.Union, TypeFlags.Intersection, TypeFlags.UnionOrIntersection],
  AdvancedTypes: [
    TypeFlags.TypeParameter,
    TypeFlags.Index,
    TypeFlags.IndexedAccess,
    TypeFlags.Conditional,
    TypeFlags.Substitution,
    TypeFlags.TemplateLiteral,
    TypeFlags.StringMapping,
  ],
  TypeCombinations: [
    TypeFlags.Literal,
    TypeFlags.Unit,
    TypeFlags.Freshable,
    TypeFlags.PossiblyFalsy,
    TypeFlags.StructuredType,
    TypeFlags.TypeVariable,
    TypeFlags.InstantiableNonPrimitive,
    TypeFlags.InstantiablePrimitive,
    TypeFlags.Instantiable,
    TypeFlags.StructuredOrInstantiable,
    TypeFlags.Narrowable,
  ],
} as const;

export type CategoryType = keyof typeof GroupedTypeFlags;
