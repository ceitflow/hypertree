import { Graph, Directory as Dir } from 'program/program.type';
import { CodeFile as Code } from 'program/code-file/code-file.type';
import { OtherFile as Other } from 'program/other-file/other-file.type';
import { DeclarationNode as Decl } from 'program/code-file/declaration.type';

// reexported types from backend
export type Directory = Dir;
export type CodeFile = Code;
export type OtherFile = Other;
export type Declaration = Decl;
export type ProgramGraph = Graph;

export enum FileEnum {
  Code = 0,
  Other = 1,
}
export type IdPath = string;

// todo distinguish ContainerModel from NodeModel
// directory and codeFile are containers
// declaration and OtherFile is NodeModel
// todo or 4 different models for each ref type
export type NodeModel = {
  id: IdPath;
  name: string;
  ref:
    | { type: 'directory'; node: Directory }
    | { type: 'codeFile'; node: CodeFile }
    | { type: 'otherFile'; node: OtherFile }
    | { type: 'declaration'; node: Declaration }; // ref is underlying data that this node represents
  parent: NodeModel | null;
  children: NodeModel[];
  childrenDepth: number; // depth of children relative to this node
  width: number;
  depth: number;
  angle: number;
  x: number;
  y: number;
  spiralLength: number;
  shapePoints: {
    top: [number, number][]; // right to left
    bottom: [number, number][]; // left to right
  }; // points relative to x,y
  labelPoints: [number, number, number][]; // x,y,angle
  range: [NodeModel, NodeModel]; // by default it points to [self, self]
};

// for tidy tree algorithm
export type TidyNode = {
  readonly ref: NodeModel;
  parent: TidyNode | null;
  children: TidyNode[];
  width: number;
  isVirtual: boolean;
  depth: number;
  i: number; // index of child in its parent
  Ancestor: TidyNode | null; // default ancestor
  ancestor: TidyNode; // ancestor
  prelim: number;
  mod: number;
  change: number;
  shift: number;
  thread: TidyNode | null;
  padding: number; // right
  margin: number; // left
};
