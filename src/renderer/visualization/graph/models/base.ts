import { BBox, GraphNode, ParentType } from './types';

export type BaseOpt = {
  parent?: ParentType;
  children?: GraphNode[];
  area?: number; // square pixels, for calculating weighted margins
  radius?: number;
  bbox?: BBox;
};

export class GraphNodeBase {
  public parent: ParentType;
  public children: GraphNode[];
  public area: number;
  public radius: number;
  public bbox: BBox;

  constructor(opt: BaseOpt) {
    this.parent = opt.parent || null;
    this.children = opt.children || [];
    this.area = opt.area || 0;
    this.radius = opt.radius || Math.round(Math.sqrt(this.area)) || 1;
    this.bbox = opt.bbox || { x: 0, y: 0, width: 0, height: 0 };
  }
}
