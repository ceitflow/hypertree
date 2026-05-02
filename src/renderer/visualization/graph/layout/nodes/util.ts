import { BBox, DirectoryGraphNode, GraphNodeBase, ParentType } from '../../models';

export function getCentroid(parent: ParentType) {
  const bbox = !parent ? { x: 0, y: 0, width: 0, height: 0 } : intersection(parent.children);
  return { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
}

export function intersection(nodes: GraphNodeBase[]): BBox {
  if (!nodes.length) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const node of nodes) {
    const { x, y, width, height } = node.bbox;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

export function getEachAfterNodes(root: GraphNodeBase): GraphNodeBase[] {
  const nodes: GraphNodeBase[] = [root];
  const next: GraphNodeBase[] = [];
  let node: GraphNodeBase | undefined;

  while (nodes.length) {
    node = nodes.pop()!;
    next.push(node);
    for (let i = 0; i < node.children.length; i++) nodes.push(node.children[i]);
  }
  return next;
}

export function getEachAfterDirectories(root: GraphNodeBase): DirectoryGraphNode[] {
  const nodes: GraphNodeBase[] = [root];
  const next: DirectoryGraphNode[] = [];
  let node: GraphNodeBase | undefined;

  while (nodes.length) {
    node = nodes.pop()!;
    if (node instanceof DirectoryGraphNode) next.push(node);
    for (let i = 0; i < node.children.length; i++) nodes.push(node.children[i]);
  }
  return next;
}
