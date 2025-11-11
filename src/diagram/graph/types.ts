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
  Other = 1
}
export type IdPath = string;

export type NodeModel = {
  id: IdPath;
  name: string;
  ref:
    | { type: 'directory'; node: Directory }
    | { type: 'codeFile'; node: CodeFile }
    | { type: 'otherFile'; node: OtherFile }
    | { type: 'declaration'; node: Declaration }; // ref is underlying data that this layout represents
  parent: NodeModel | null;
  children: NodeModel[];
  diameter: number;
  depth: number; // dynamically changed depth
  angle: number;
  x: number;
  y: number;
  range: [NodeModel, NodeModel]
};

// node for tidy tree algorithm
export type TidyNode = {
  readonly ref: NodeModel;
  parent: TidyNode | null;
  children: TidyNode[];
  diameter: number;
  isVirtual: boolean;
  depth: number;
  i: number; // index of child in its parent
  x: number;
  y: number;
  Ancestor: TidyNode | null; // default ancestor
  ancestor: TidyNode; // ancestor
  prelim: number;
  mod: number;
  change: number;
  shift: number;
  thread: TidyNode | null;
  range: [TidyNode, TidyNode],
}

export type LinkModel = {
  // GroupLink and Link
  source: NodeModel;
  target: NodeModel;
};
