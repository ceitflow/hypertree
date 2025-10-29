import { TypeFlags } from 'typescript';
import { DeclarationEnum } from '../files/declaration.type';

const GroupedTypeFlags = {
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

type CategoryType = keyof typeof GroupedTypeFlags;

export class TypeAnalyzer {
  getTypeFlagCategory(itemFlags: TypeFlags): { astType: string; category: DeclarationEnum } {
    for (const [category, flags] of Object.entries(GroupedTypeFlags)) {
      const match = flags.find(f => f === itemFlags);
      if (match) {
        return { astType: TypeFlags[match], category: this.categoryToDeclarationEnum(category as CategoryType) };
      }
    }
    return { astType: 'Unknown', category: DeclarationEnum.Unknown };
  }

  private categoryToDeclarationEnum(category: CategoryType): DeclarationEnum {
    switch (category) {
      case 'Unknown':
        return DeclarationEnum.Unknown;
      case 'Boolean':
        return DeclarationEnum.Primitive;
      case 'Number':
        return DeclarationEnum.Primitive;
      case 'String':
        return DeclarationEnum.Primitive;
      case 'Symbol':
        return DeclarationEnum.Primitive;
      case 'BigInt':
        return DeclarationEnum.Primitive;
      case 'Enum':
        return DeclarationEnum.Object;
      case 'Object':
        return DeclarationEnum.Object; // todo TypeFlags return Object for Es6 classes and functions too
      case 'CompositeTypes':
        return DeclarationEnum.TsType;
      case 'AdvancedTypes':
        return DeclarationEnum.TsType;
      case 'TypeCombinations':
        return DeclarationEnum.TsType;
    }
  }
}