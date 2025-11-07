import { createPrinter, EmitHint, NewLineKind, Node } from 'typescript';

export class Debug {
  static debugPrettyPrint(node: Node): string {
    return createPrinter({
      newLine: NewLineKind.LineFeed,
      removeComments: true,
      noEmitHelpers: true,
      omitTrailingSemicolon: true,
    })
      .printNode(EmitHint.Unspecified, node, node.getSourceFile())
      .split('\n')[0];
  }
}