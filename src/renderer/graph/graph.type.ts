import { CodeFile, DeclarationNode, Directory, OtherFile } from '@lib/ast';

export type GraphModel = {
  root: DirectoryGraphNode;
};

export type ParentType = GraphNode | null;
export type BBox = { x: number; y: number; width: number; height: number };
export type Margin = { top: number; bottom: number; left: number; right: number };

export enum GraphNodeEnum {
  Code = 'code',
  Declaration = 'declaration',
  Other = 'other',
  Directory = 'directory',
  Virtual = 'virtual'
}

type GraphNodeBase = {
  parent: ParentType;
  children: GraphNode[];
  area: number; // square pixels, for calculating weighted margins
  bbox: BBox; // includes padding
  margin: Margin;
  padding: Margin;
  labelPoints: [number, number, number][]; // x,y,angle
};

export type DirectoryGraphNode = GraphNodeBase & {
  type: GraphNodeEnum.Directory;
  ast: Directory;
};

export type CodeGraphNode = GraphNodeBase & {
  type: GraphNodeEnum.Code;
  ast: CodeFile;
  layoutColumns: number;
};

export type OtherGraphNode = GraphNodeBase & {
  type: GraphNodeEnum.Other;
  ast: OtherFile;
  layoutColumns: number;
};

export type DeclarationGraphNode = Omit<GraphNodeBase, 'parent'> & {
  parent: CodeGraphNode;
  type: GraphNodeEnum.Declaration;
  ast: DeclarationNode;
  isSplit: boolean;
};

export type VirtualGraphNode = GraphNodeBase & {
  type: GraphNodeEnum.Virtual;
  isColumnWrapper: boolean;
};

export type GraphNode = DirectoryGraphNode | CodeGraphNode | OtherGraphNode | DeclarationGraphNode | VirtualGraphNode;
