import { NodeModel, IdPath, TidyNode } from '../types.ts';

export const NodeDiameter = 12;

export class LayoutFactory {
  static createNode(ref: NodeModel['ref'], id: IdPath, parent: NodeModel | null): NodeModel {
    const model: NodeModel = {
      id,
      name: ref.node.name,
      ref,
      parent,
      children: [],
      diameter: NodeDiameter,
      depth: parent ? parent.depth + 1 : 0,
      angle: 0,
      x: 0,
      y: 0,
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
      diameter: ref.diameter,
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
      range: null as any,
    }
    result.ancestor = result;
    result.range = [result, result]
    return result;
  }

  static buildTidyTreeNodes(root: NodeModel): TidyNode {
    const result = this.createTidyNode(root);
    const stack = [result];
    while (stack.length) {
      const node = stack.pop()!;
      if (node.ref.id.startsWith('BUILD.bazel')) console.log(node.ref.id);
      node.ref.children.forEach(c => {
        const child = this.createTidyNode(c, node);
        node.children.push(child);
        stack.push(child);
      })
    }
    return result;
  }
}
