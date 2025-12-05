import { NodeModel, IdPath, TidyNode } from '../types.ts';

export const NodeWidth = 10;
export const SpiralArmWidth = 60;

export class NodeFactory {
  static createNode(ref: NodeModel['ref'], id: IdPath, parent: NodeModel | null): NodeModel {
    const model: NodeModel = {
      id,
      name: ref.node.name,
      ref,
      parent,
      children: [],
      childrenDepth: 0,
      width: ref.type === 'declaration' ? Math.max(Math.round(ref.node.loc / 2), 10) : NodeWidth, // default width
      depth: parent ? parent.depth + 1 : 0,
      angle: 0,
      x: 0,
      y: 0,
      spiralLength: 0,
      outerArc: [],
      innerArc: [],
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
      i: parent ? parent.children.length : 0,
      isVirtual,
      depth: ref.depth,

      x: 0, // tidy tree produces x positions only
      y: 0,
      Ancestor: null,
      ancestor: null as unknown as TidyNode,
      prelim: 0,
      mod: 0,
      change: 0,
      shift: 0,
      thread: null,
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
