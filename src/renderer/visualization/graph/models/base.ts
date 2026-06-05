import { IdPath } from '@lib/ast';
import type { VirtualGraphNode } from './virtual-node';
import { BBox, GraphNode, GraphNodeEnum, Margin, ParentType } from './types';

export type BaseOpt = {
  id: IdPath;
  parent?: ParentType;
  children?: GraphNode[];
  area?: number;
  depth?: number;
  margin?: Margin;
  padding?: number;
  bbox?: BBox;
};

export class GraphNodeBase {
  public id: IdPath;
  public parent: ParentType;
  public children: GraphNode[];
  public area: number;
  public depth: number;
  public margin: Margin;
  public padding: number;
  public bbox: BBox;
  public rows: GraphNodeBase[][];
  public header: VirtualGraphNode | null;
  readonly type!: GraphNodeEnum;

  constructor(opt: BaseOpt) {
    this.id = opt.id;
    this.parent = opt.parent || null;
    this.children = opt.children || [];
    this.area = opt.area || 0;
    this.depth = opt.depth || 0;
    this.margin = opt.margin || { left: 0, top: 0, right: 0, bottom: 0 };
    this.padding = opt.padding || 0;
    this.bbox = {
      x: opt.bbox?.x ?? 0,
      y: opt.bbox?.y ?? 0,
      width: 1,
      height: 1
    };
    this.rows = [];
    this.header = null;
  }
}
