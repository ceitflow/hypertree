import { OtherFile } from '@lib/ast';
import { BaseOpt, GraphNodeBase } from './base';
import { GraphNodeEnum, ParentType } from './types';

export class OtherGraphNode extends GraphNodeBase {
  static defaultWidth = 60;
  readonly type = GraphNodeEnum.Other;

  constructor(
    opt: BaseOpt,
    public ast: OtherFile,
  ) {
    super(opt);
  }

  static create(parent: ParentType, ast: OtherFile) {
    // if (ast.bigFile) bbox.height = 10;
    return new OtherGraphNode(
      {
        id: ast.id,
        parent,
        area: ast.loc
      },
      ast
    );
  }
}
