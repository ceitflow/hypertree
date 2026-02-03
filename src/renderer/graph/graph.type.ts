import { CodeFile, DeclarationNode, Directory, OtherFile } from '@lib/ast';

export type GraphModel = {
  root: GraphNode;
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
  area: number; // square pixels
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
};

export type OtherGraphNode = GraphNodeBase & {
  type: GraphNodeEnum.Other;
  ast: OtherFile;
};

export type DeclarationGraphNode = GraphNodeBase & {
  type: GraphNodeEnum.Declaration;
  ast: DeclarationNode;
};

export type VirtualGraphNode = GraphNodeBase & {
  type: GraphNodeEnum.Virtual;
  isColumnWrapper: boolean;
};

export type GraphNode = DirectoryGraphNode | CodeGraphNode | OtherGraphNode | DeclarationGraphNode | VirtualGraphNode;
