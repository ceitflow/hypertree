import { BBox, CodeGraphNode, DirectoryGraphNode, GraphNodeBase, ParentType } from '../../models';

export function getEncompassingSquareBBox(nodes: GraphNodeBase[]): BBox {
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

  const max = Math.max(maxX - minX, maxY - minY);

  return {
    x: minX,
    y: minY,
    width: max,
    height: max
  };
}

export function getEachAfterNodes(root: GraphNodeBase): GraphNodeBase[] {
  const nodes: GraphNodeBase[] = [root];
  const next: GraphNodeBase[] = [];
  let node: GraphNodeBase | undefined;

  while (nodes.length) {
    node = nodes.pop()!;
    if (node instanceof DirectoryGraphNode || (node instanceof CodeGraphNode && node.children.length)) next.push(node);
    for (let i = 0; i < node.children.length; i++) nodes.push(node.children[i]);
  }
  return next;
}
