import { OtherFile } from '@lib/ast';
import { BaseOpt, GraphNodeBase } from './base';
import { GraphNodeEnum, ParentType } from './types';

export class OtherGraphNode extends GraphNodeBase {
  static defaultWidth = 60;
  readonly type = GraphNodeEnum.Other;

  constructor(
    opt: BaseOpt,
    public ast: OtherFile,
    public layoutColumns: number
  ) {
    super(opt);
  }

  static create(parent: ParentType, ast: OtherFile) {
    // if (ast.bigFile) bbox.height = 10;
    return new OtherGraphNode(
      {
        parent,
        area: ast.loc,
        bbox: { x: 0, y: 0, width: OtherGraphNode.defaultWidth, height: ast.loc },
        margin: { top: 0, bottom: 10, left: 0, right: 10 }
      },
      ast,
      1
    );
  }
}
