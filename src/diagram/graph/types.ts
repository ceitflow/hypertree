import * as ast from '../../../backend/src/files/file.type';
import { DeclarationNode } from '../../../backend/src/files/declaration.type.ts';

// reexported types from backend
export type Directory = ast.Directory;
export type File = ast.File;
export type Declaration = DeclarationNode;
export type ProgramGraph = ast.ProgramGraph;
export type IdPath = ast.IdPath;

// layout data is created in the frontend
export type RadialModel = {
  rootId: IdPath; // id of root LayoutModel
  parentNode: NodeModel | null;
  children: Map<IdPath, NodeModel>;
  ejectedRadials: Map<IdPath, RadialModel>;
  x: number;
  y: number;
  radius: number; // including ejectedRadials
  selfRadius: number;
};

export type NodeModel = {
  id: IdPath;
  name: string;
  radialId: IdPath;
  readonly ref: // underlying data that this layout represents
  { type: 'directory'; node: Directory } | { type: 'file'; node: File } | { type: 'declaration'; node: Declaration };

  isVirtual: boolean;
  isEjected: boolean;

  parent: NodeModel | null;
  children: NodeModel[]; // todo in paper check if child.radialId is from different radial
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
  totalWidth: number;

  resetLayout: () => void;
};

export type LinkModel = {
  // GroupLink and Link
  source: NodeModel;
  target: NodeModel;
};
