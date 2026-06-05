import { BaseOpt, GraphNodeBase } from './base';
import { GraphNode, GraphNodeEnum, ParentType } from './types';

export class VirtualGraphNode extends GraphNodeBase {
  readonly type = GraphNodeEnum.Virtual;
  public isHeader = false;

  constructor(opt: BaseOpt) {
    super(opt);
  }

  static create(id: string, parent: ParentType) {
    return new VirtualGraphNode(
      {
        id,
        parent,
        children: [] as GraphNode[],
        area: 0
      }
    );
  }
}
