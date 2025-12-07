import { NodeModel, IdPath, TidyNode } from '../types.ts';

export const NodeSize = 80;
export const DirPadding = 10;
export const SpiralArmWidth = NodeSize + DirPadding;

export class NodeFactory {
  static createNode(ref: NodeModel['ref'], id: IdPath, parent: NodeModel | null): NodeModel {
    let width: number;
    switch (ref.type) {
      case 'codeFile':
        width = ref.node.loc;
        break;
      case 'otherFile':
        width = ref.node.loc;
        break;
      default:
        width = NodeSize;
    }

    const model: NodeModel = {
      id,
      name: ref.node.name,
      ref,
      parent,
      children: [],
      childrenDepth: 0,
      width,
      depth: parent ? parent.depth + 1 : 0,
      angle: 0,
      x: 0,
      y: 0,
      spiralLength: 0,
      shapePoints: {
        top: [],
        bottom: [],
      },
      labelArcPoints: [],
      range: [] as any,
    };
    model.range = [model, model];
    return model;
  }

  static createTidyNode(ref: NodeModel, parent: TidyNode | null = null, isVirtual = false): TidyNode {
    const result: TidyNode =  {
      ref,
      parent,
      children: [],
      width: ref.width,
      isVirtual,
      depth: ref.depth,
      i: parent ? parent.children.length : 0,
      Ancestor: null,
      ancestor: null as unknown as TidyNode,
      prelim: 0,
      mod: 0,
      change: 0,
      shift: 0,
      thread: null,
      padding: 0,
      margin: 0,
    }
    result.ancestor = result;
    return result;
  }

  static buildTidyTreeNodes(root: NodeModel): TidyNode {
    const result = this.createTidyNode(root);
    const stack = [result];
    while (stack.length) {
      const node = stack.pop()!;
      node.ref.children.forEach(c => {
        const child = this.createTidyNode(c, node);
        node.children.push(child);
        stack.push(child);
      })
    }
    return result;
  }
}
