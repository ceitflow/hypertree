import { BaseOpt, GraphNodeBase } from './base';
import { GraphNode, GraphNodeEnum, ParentType } from './types';

export class VirtualGraphNode extends GraphNodeBase {
  readonly type = GraphNodeEnum.Virtual;
  public isHeader = false;

  constructor(opt: BaseOpt) {
    super(opt);
  }

  static create(id: string, parent: ParentType, isHeader: boolean): VirtualGraphNode {
    const node = new VirtualGraphNode(
      {
        id,
        name: isHeader ? '' : `files ${parent ? parent.name : ''}`,
        parent,
        children: [] as GraphNode[],
        area: 0,
      }
    );
    node.isHeader = isHeader;
    return node;
  }
}
