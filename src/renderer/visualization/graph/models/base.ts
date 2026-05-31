import { IdPath } from '@lib/ast';
import { BBox, GraphNode, GraphNodeEnum, ParentType } from './types';

export type BaseOpt = {
  id: IdPath;
  parent?: ParentType;
  children?: GraphNode[];
  area?: number;
  bbox?: BBox;
};

export class GraphNodeBase {
  public id: IdPath;
  public parent: ParentType;
  public children: GraphNode[];
  public area: number;
  public bbox: BBox;
  readonly type!: GraphNodeEnum;
  public treeMapValue: number;
  public depth: number;

  constructor(opt: BaseOpt) {
    this.id = opt.id;
    this.parent = opt.parent || null;
    this.children = opt.children || [];
    this.area = opt.area || 0;
    this.bbox = {
      x: opt.bbox?.x ?? 0,
      y: opt.bbox?.y ?? 0,
      width: 1,
      height: 1
    };
    this.treeMapValue = 0;
    this.depth = 0;
  }
}
