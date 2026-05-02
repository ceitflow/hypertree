import { IdPath } from '@lib/ast';
import { BBox, GraphNode, GraphNodeEnum, ParentType } from './types';

export type BaseOpt = {
  id: IdPath;
  parent?: ParentType;
  children?: GraphNode[];
  area?: number; // square pixels, for calculating weighted margins
  radius?: number;
  bbox?: BBox;
};

export class GraphNodeBase {
  public id: IdPath;
  public parent: ParentType;
  public children: GraphNode[];
  public area: number;
  public radius: number;
  public bbox: BBox;
  readonly type!: GraphNodeEnum;
  public vx = 0; // force layout velocity
  public vy = 0;

  constructor(opt: BaseOpt) {
    this.id = opt.id;
    this.parent = opt.parent || null;
    this.children = opt.children || [];
    this.area = opt.area || 0;
    this.radius = opt.radius || Math.round(Math.sqrt(this.area)) || 1;
    this.bbox = {
      x: opt.bbox?.x ?? 0,
      y: opt.bbox?.y ?? 0,
      width: this.radius * 2,
      height: this.radius * 2
    };
  }
}
