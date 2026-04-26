import { Directory } from '@lib/ast';
import { VisibilityGraph } from './edges';
import { BaseOpt, GraphNodeBase } from './base';
import { GraphNodeEnum, ParentType } from './types';

export class DirectoryGraphNode extends GraphNodeBase {
  readonly type = GraphNodeEnum.Directory;
  routeVisibilityGraph: VisibilityGraph = {
    // for routing edges within this directory
    rootNodeId: 0,
    vertices: new Map()
  };

  constructor(
    opt: BaseOpt,
    public ast: Directory
  ) {
    super(opt);
  }

  static create(parent: ParentType, ast: Directory) {
    return new DirectoryGraphNode({ parent }, ast);
  }
}
