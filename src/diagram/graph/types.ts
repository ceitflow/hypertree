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

// layout data is created in the frontend
export type RadialModel = {
  rootId: IdPath; // id of root LayoutModel
  parentNode: NodeModel | null;
  children: Map<IdPath, NodeModel>;
  ejectedRadials: Map<IdPath, RadialModel>;
  x: number; // relative to parent
  y: number; // relative to parent
  depth: number; // this radius depth
  // ejectsDepth: number; // depth of deepest eject
  radius: number; // including ejectedRadials
  selfRadius: number;
};

export type NodeModel = {
  id: IdPath;
  name: string;
  radialId: IdPath;
  readonly ref:
    | { type: 'directory'; node: Directory }
    | { type: 'codeFile'; node: CodeFile }
    | { type: 'otherFile'; node: OtherFile }
    | { type: 'declaration'; node: Declaration }; // ref is underlying data that this layout represents

  diameter: number;

  isMainRoot: boolean;
  isVirtual: boolean;
  isEjected: boolean;

  parent: NodeModel | null;
  children: NodeModel[];
  depth: number; // dynamically changed depth
  i: number; // index of child in parent.children


  x: number;
  y: number;
  Ancestor: NodeModel | null; // default ancestor
  ancestor: NodeModel; // ancestor
  prelim: number;
  mod: number;
  change: number;
  shift: number;
  thread: NodeModel | null;
  angle: number;
  angleAdjustment: number;
  polarX: number;
  polarY: number;
  totalWidth: number; // TODO replace with [minX, maxX]

  resetLayout: () => void;
  markAsEjected: () => void;
  calculatePolar: (fullWidth: number, sep: number) => void;
};

export type LinkModel = {
  // GroupLink and Link
  source: NodeModel;
  target: NodeModel;
};
