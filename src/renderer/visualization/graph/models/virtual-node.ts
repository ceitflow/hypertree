import { BaseOpt, GraphNodeBase } from './base';
import { GraphNode, GraphNodeEnum, ParentType } from './types';

type Flags = {
  isFilesContainer: boolean;
  isHeader: boolean;
  isColumn: boolean;
};

// node that is not in source code, used for grouping and layout
export class VirtualGraphNode extends GraphNodeBase {
  readonly type = GraphNodeEnum.Virtual;
  public flags: Flags = {
    isFilesContainer: false,
    isHeader: false,
    isColumn: false
  };

  constructor(opt: BaseOpt) {
    super(opt);
  }

  static create(id: string, parent: ParentType, flags: Partial<Flags> = {}): VirtualGraphNode {
    const resolvedFlags: Flags = {
      isFilesContainer: false,
      isHeader: false,
      isColumn: false,
      ...flags
    };
    const node = new VirtualGraphNode({
      id,
      name:
        resolvedFlags.isHeader || resolvedFlags.isColumn
          ? ''
          : resolvedFlags.isFilesContainer
            ? `files ${parent ? parent.name : ''}`
            : '',
      parent,
      children: [] as GraphNode[],
      area: 0
    });
    node.flags = resolvedFlags;
    return node;
  }
}
