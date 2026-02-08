import { GraphNode } from '../treemap/graph';

export function eachAfter(root: GraphNode, callback: (node: GraphNode) => void): void {
  const nodes: GraphNode[] = [root];
  const next: GraphNode[] = [];
  let node: GraphNode | undefined;

  while (nodes.length) {
    node = nodes.pop()!;
    next.push(node);
    for (let i = 0; i < node.children.length; i++) nodes.push(node.children[i]);
  }
  while (next.length) callback(next.pop()!);
}

export function eachBefore(root: GraphNode, callback: (node: GraphNode) => void): void {
  const nodes: GraphNode[] = [root];
  let node: GraphNode | undefined;

  while (nodes.length) {
    node = nodes.pop()!;
    callback(node);
    for (let i = node.children.length - 1; i >= 0; i--) nodes.push(node.children[i]);
  }
}
