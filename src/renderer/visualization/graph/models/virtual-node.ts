import { BaseOpt, GraphNodeBase } from './base';
import { GraphNode, GraphNodeEnum, ParentType } from './types';

export class VirtualGraphNode extends GraphNodeBase {
  readonly type = GraphNodeEnum.Virtual;

  constructor(
    opt: BaseOpt,
    public isColumnWrapper: boolean
  ) {
    super(opt);
  }

  static create(parent: ParentType, isColumnWrapper: boolean) {
    return new VirtualGraphNode(
      {
        parent,
        children: [] as GraphNode[],
        area: 0,
        bbox: { x: 0, y: 0, width: 0, height: 0 },
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        labelPoints: [] as [number, number, number][]
      },
      isColumnWrapper
    );
  }
}
