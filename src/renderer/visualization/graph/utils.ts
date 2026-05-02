import { GraphNodeBase } from './models';

export function eachAfter(root: GraphNodeBase, callback: (node: GraphNodeBase) => void): void {
  const nodes: GraphNodeBase[] = [root];
  const next: GraphNodeBase[] = [];
  let node: GraphNodeBase | undefined;

  while (nodes.length) {
    node = nodes.pop()!;
    next.push(node);
    for (let i = 0; i < node.children.length; i++) nodes.push(node.children[i]);
  }
  while (next.length) callback(next.pop()!);
}

export function eachBefore(root: GraphNodeBase, callback: (node: GraphNodeBase) => void): void {
  const nodes: GraphNodeBase[] = [root];
  let node: GraphNodeBase | undefined;

  while (nodes.length) {
    node = nodes.pop()!;
    callback(node);
    for (let i = node.children.length - 1; i >= 0; i--) nodes.push(node.children[i]);
  }
}
