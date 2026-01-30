import { CodeFile, DeclarationNode, Directory, NodeEnum, OtherFile } from '@lib/ast';

export type GraphModel = {
  root: GraphNode<NodeEnum.Directory>;
}

export type VirtualNode = {
  type: NodeEnum.Virtual; // for grouping files in a single node
};

/** Maps NodeEnum to the corresponding ref type for GraphNode */
type AstRef<T extends NodeEnum> = T extends NodeEnum.Directory
  ? Directory
  : T extends NodeEnum.Code
    ? CodeFile
    : T extends NodeEnum.Other
      ? OtherFile
      : T extends NodeEnum.Declaration
        ? DeclarationNode
        : T extends NodeEnum.Virtual
          ? VirtualNode
          : never;

export type GraphNode<T extends NodeEnum = NodeEnum> = {
  ref: AstRef<T>;
  parent: GraphNode | null;
  children: GraphNode[];

  area: number; // square pixels
  bbox: BBox;
  margin: Margin;
  padding: Margin;
  labelPoints: [number, number, number][]; // x,y,angle
};

export type BBox = { x: number; y: number; width: number; height: number };
export type Margin = { top: number; bottom: number; left: number; right: number };
