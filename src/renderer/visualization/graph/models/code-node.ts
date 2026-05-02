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
  ) {
    super(opt);
  }

  static create(parent: ParentType, ast: CodeFile) {
    return new CodeGraphNode(
      {
        id: ast.id,
        parent,
        area: ast.loc
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
  ) {
    super(opt);
  }

  static create(parent: CodeGraphNode, ast: DeclarationNode) {
    return new DeclarationGraphNode(
      {
        id: ast.id,
        parent,
        area: ast.loc
      },
      ast
    );
  }

  static createFromCodeFile(file: CodeGraphNode): DeclarationGraphNode[] {
    return file.ast.definitions.map((e) => DeclarationGraphNode.create(file, e));
  }
}
