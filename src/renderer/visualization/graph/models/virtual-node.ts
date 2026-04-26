import { BaseOpt, GraphNodeBase } from './base';
import { GraphNode, GraphNodeEnum, ParentType } from './types';

export class VirtualGraphNode extends GraphNodeBase {
  readonly type = GraphNodeEnum.Virtual;

  constructor(opt: BaseOpt) {
    super(opt);
  }

  static create(parent: ParentType) {
    return new VirtualGraphNode(
      {
        parent,
        children: [] as GraphNode[],
        area: 0,
        bbox: { x: 0, y: 0, width: 0, height: 0 }
      }
    );
  }
}
