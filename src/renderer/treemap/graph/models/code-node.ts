import { BaseOpt, GraphNodeBase } from './base';
import { GraphNodeEnum, ParentType } from './types';
import { CodeFile, DeclarationNode } from '@lib/ast';

export class CodeGraphNode extends GraphNodeBase {
  static defaultWidth = 60;
  public children: DeclarationGraphNode[] = [];
  readonly type = GraphNodeEnum.Code;

  constructor(
    opt: BaseOpt,
    public ast: CodeFile,
    public layoutColumns = 1
  ) {
    super(opt);
  }

  static create(parent: ParentType, ast: CodeFile) {
    const m = Math.round(Math.sqrt(ast.loc));
    const padding = { top: Math.max(m, 6), bottom: 0, left: 0, right: 0 };
    return new CodeGraphNode(
      {
        parent,
        area: ast.loc,
        bbox: {
          x: 0,
          y: 0,
          width: CodeGraphNode.defaultWidth + padding.left + padding.right,
          height: ast.loc + padding.top + padding.bottom
        },
        margin: { top: 0, bottom: m, left: 0, right: m },
        padding
      },
      ast
    );
  }
}

export class DeclarationGraphNode extends GraphNodeBase {
  readonly type = GraphNodeEnum.Declaration;
  declare parent: CodeGraphNode;

  constructor(
    opt: BaseOpt,
    public ast: DeclarationNode,
    public isSplit = false
  ) {
    super(opt);
  }

  static create(parent: CodeGraphNode, ast: DeclarationNode) {
    return new DeclarationGraphNode(
      {
        parent,
        area: ast.loc,
        bbox: { x: 0, y: 0, width: CodeGraphNode.defaultWidth, height: ast.loc },
        margin: { top: 0, bottom: 4, left: 0, right: 0 }
      },
      ast
    );
  }

  static createFromCodeFile(file: CodeGraphNode): DeclarationGraphNode[] {
    return file.ast.definitions.map((e) => DeclarationGraphNode.create(file, e));
  }
}
