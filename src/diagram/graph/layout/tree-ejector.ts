import { LayoutModel } from '../types.ts';
import { GraphFactory } from '../graph-factory.ts';
import { eachAfter, eachBefore, RADIUS, SEPARATION } from './tidy-tree.ts';

export function ProcessEjects(root: LayoutModel, totalDepth: number) {
  recalculatePostLayout(root, totalDepth);

  const shrunkMap = new Map<string, boolean>();
  const currDepthEntry = { nodes: [...root.children], totalWidth: root.postLayout.totalWidth };

  while (currDepthEntry.nodes.length) {
    const { nodes, totalWidth } = currDepthEntry;
    const depth = nodes[0].layout.depth;
    const available = 2 * Math.PI * RADIUS * (depth + 1);
    const widthToRemove = Math.max(0, totalWidth - available);

    if (widthToRemove) {
      console.log(`${depth}. available: ${available}, taken: ${totalWidth}, toRemove: ${widthToRemove}`);
      const toShrink = pickNodesToShrink(nodes, shrunkMap, widthToRemove);
      toShrink.forEach(child => shrinkSubtree(child, totalDepth, shrunkMap));
    }

    currDepthEntry.nodes = [];
    currDepthEntry.totalWidth = 0;
    nodes.forEach(n => {
      n.children.forEach(child => {
        if (shrunkMap.has(child.idPath)) {
          return;
        }
        currDepthEntry.nodes.push(child);
        currDepthEntry.totalWidth += child.postLayout.totalWidth || SEPARATION; // if its leaf node then use its width instead
      });
    });
  }
}

function pickNodesToShrink(allNodes: LayoutModel[], shrunkMap: Map<string, boolean>, widthToRemove: number): LayoutModel[] {
  const nodesToRemove: LayoutModel[] = [];
  let partialToRemove: LayoutModel | null = null;
  let tempRemainingWidth = widthToRemove;

  // sorts from largest to smallest subtrees
  allNodes.sort((a, b) => b.postLayout.totalWidth - a.postLayout.totalWidth);

  for (let i = 0; i < allNodes.length; i++) {
    const child = allNodes[i];
    const width = child.postLayout.totalWidth;
    if (width <= SEPARATION) continue; // replacing single width node won't do anything, so continue
    // if node is smaller than the necessary width to remove, this node will be removed
    if (width <= tempRemainingWidth) {
      nodesToRemove.push(child);
      tempRemainingWidth -= width - SEPARATION;
      continue;
    }
    partialToRemove = child;
    break;
  }

  if (partialToRemove) {
    const partialChildren = partialToRemove.children.filter(c => !shrunkMap.has(c.idPath));
    const childrenToRemove = pickNodesToShrink(partialChildren, shrunkMap, tempRemainingWidth);
    // if no children removal will be enough, remove partial node itself
    if (!childrenToRemove.length) nodesToRemove.push(partialToRemove);
    else nodesToRemove.push(...childrenToRemove);
  }

  return nodesToRemove;
}

export function recalculatePostLayout(root: LayoutModel, totalDepth: number) {
  const tempLeftNeighbors: LayoutModel[] = new Array(totalDepth).fill(null); // [0] depth, [1] depth ...

  eachAfter(root, node => {
    const postLayout = node.postLayout;
    // calculate neighbors of each node
    const currentDepth = node.layout.depth;
    if (tempLeftNeighbors[currentDepth]) {
      const neigh = tempLeftNeighbors[currentDepth];
      postLayout.leftNeighbour = neigh;
      neigh.postLayout.rightNeighbour = node;
      postLayout.shrunkLeftXPos = neigh.layout.x;
    }
    tempLeftNeighbors[currentDepth] = node;

    // iterate node children to update parent leftmost and rightmost nodes on each depth
    node.children.forEach(child => {
      child.postLayout.depthsLeftRightNodes.forEach(([leftDepth, rightDepth], depthChildIdx) => {
        const idx = child.layout.depth - currentDepth + depthChildIdx;
        const nodeDepths = postLayout.depthsLeftRightNodes[idx];
        if (!nodeDepths) {
          postLayout.depthsLeftRightNodes[idx] = [leftDepth, rightDepth];
          return;
        }
        if (leftDepth.layout.x < nodeDepths[0].layout.x) nodeDepths[0] = leftDepth;
        if (rightDepth.layout.x > nodeDepths[1].layout.x) nodeDepths[1] = rightDepth;
      });
    });

    // calculate position for if this subtree is shrunk and totalWidth
    let leftMost = node;
    let rightMost = node;
    postLayout.depthsLeftRightNodes.forEach(([leftDepth, rightDepth]) => {
      const neigh = leftDepth.postLayout.leftNeighbour;
      if (neigh && neigh.layout.x > postLayout.shrunkLeftXPos) postLayout.shrunkLeftXPos = neigh.layout.x;
      if (leftDepth.layout.x <= leftMost.layout.x) leftMost = leftDepth;
      if (rightDepth.layout.x >= rightMost.layout.x) rightMost = rightDepth;
    });
    postLayout.totalWidth = rightMost.layout.x - leftMost.layout.x;
  });
}

function shrinkSubtree(node: LayoutModel, totalDepth: number, shrunk: Map<string, boolean>): void {
  console.log(`shrunk ${node.idPath} ${node.postLayout.totalWidth} from depth ${node.layout.depth}.`);

  // update widths and mark shrunken nodes in registry
  eachBefore(node, child => shrunk.set(child.idPath, true));

  // replace children with virtual nodes
  node.layout.radialX = node.layout.x = node.postLayout.shrunkLeftXPos + SEPARATION;
  node.type = 'ejected';
  let temp = node;
  node.links = [];

  for (let i = node.layout.depth + 2; i < totalDepth; i++) {
    const ejected = GraphFactory.createModel({ name: node.name, nestLevel: i, path: node.idPath }, 0, temp, 'ejected');
    ejected.layout.radialX = node.layout.x;
    ejected.layout.radialY = ejected.layout.depth * RADIUS;
    temp.children = [ejected];
    temp.links.push(GraphFactory.createLinkModel(temp, ejected));
    temp = ejected;
  }
}
