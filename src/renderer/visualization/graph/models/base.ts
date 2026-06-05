import { IdPath } from '@lib/ast';
import { BBox, GraphNode, GraphNodeEnum, ParentType } from './types';

export type BaseOpt = {
  id: IdPath;
  parent?: ParentType;
  children?: GraphNode[];
  area?: number;
  depth?: number;
  margin?: number;
  padding?: number;
  bbox?: BBox;
};

export class GraphNodeBase {
  public id: IdPath;
  public parent: ParentType;
  public children: GraphNode[];
  public area: number;
  public depth: number;
  public margin: number;
  public padding: number;
  public bbox: BBox;
  public rows: GraphNodeBase[][];
  readonly type!: GraphNodeEnum;

  constructor(opt: BaseOpt) {
    this.id = opt.id;
    this.parent = opt.parent || null;
    this.children = opt.children || [];
    this.area = opt.area || 0;
    this.depth = opt.depth || 0;
    this.margin = opt.margin || 0;
    this.padding = opt.padding || 0;
    this.bbox = {
      x: opt.bbox?.x ?? 0,
      y: opt.bbox?.y ?? 0,
      width: 1,
      height: 1
    };
    this.rows = [];
  }
}
