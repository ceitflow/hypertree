import { LayoutModel } from '../types.ts';
import { GraphFactory } from '../graph-factory.ts';
import { eachAfter, eachBefore, RADIUS, SEPARATION } from './tidy-tree.ts';

type DepthRegistry = Map<number, { allNodes: LayoutModel[]; shrunk: Map<string, boolean>; totalWidth: number }>;

export function ProcessEjects(root: LayoutModel, totalDepth: number) {
  const registry: DepthRegistry = new Map();

  recalculatePostLayout(root, totalDepth);

  // build registry
  root.postLayout.depthsLeftRightNodes.forEach(([leftMost, rightMost], depth) => {
    let temp: LayoutModel | null = leftMost;
    while (temp) {
      if (!registry.has(depth))
        registry.set(depth, { allNodes: [temp], shrunk: new Map(), totalWidth: rightMost.layout.x - leftMost.layout.x });
      else registry.get(depth)!.allNodes.push(temp);
      temp = temp.postLayout.rightNeighbour;
    }
  });

  registry.forEach((entry, depth) => {
    const { allNodes, shrunk, totalWidth } = entry;
    const available = 2 * Math.PI * RADIUS * (depth + 1);
    const widthToRemove = Math.max(0, totalWidth - available);
    if (!widthToRemove) {
      return;
    }
    // sorts from largest to smallest subtrees
    allNodes.sort((a, b) => b.postLayout.totalWidth - a.postLayout.totalWidth);
    console.log(`${depth}. available: ${available}, taken: ${totalWidth}, toRemove: ${widthToRemove}`);

    // pick nodes to shrink
    const nodesToRemove: LayoutModel[] = [];
    let partialToRemove: LayoutModel | null = null;
    let tempRemainingWidth = widthToRemove;

    for (let i = 0; i < allNodes.length; i++) {
      const child = allNodes[i];
      if (shrunk.has(child.idPath)) {
        continue;
      }
      const w = child.postLayout.totalWidth;
      // if node is smaller than the necessary width to remove, this node will be removed
      if (w <= tempRemainingWidth) {
        nodesToRemove.push(child);
        tempRemainingWidth -= w;
        continue;
      }
      partialToRemove = child;
      break;
    }

    // shrink nodes and update depth widths
    nodesToRemove.forEach(child => {
      shrinkSubtree(child, totalDepth, registry);
    });

    if (partialToRemove) {
      const checkChildrenRecursively = (node: LayoutModel): LayoutModel => {
        const sorted = [...node.children].sort((a, b) => b.postLayout.totalWidth - a.postLayout.totalWidth);
        let temp: LayoutModel | null = null;
        for (const child of sorted) {
          // iterate over next children to see if the smaller one will also be good enough
          if (child.postLayout.totalWidth >= tempRemainingWidth) temp = child;
          else if (temp) return checkChildrenRecursively(temp);
          else return node; // return original node if no match found
        }
        return node;
      };
      const matchingChild = checkChildrenRecursively(partialToRemove);
      shrinkSubtree(matchingChild, totalDepth, registry);
    }
  });

  console.log(registry)
}

export function recalculatePostLayout(root: LayoutModel, totalDepth: number) {
  const tempLeftNeighbors: LayoutModel[] = new Array(totalDepth).fill(null); // [0] depth, [1] depth ...

  eachAfter(root, node => {
    if (node.type === 'virtual') {
      return;
    }
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
      if (child.type === 'virtual') return;
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

function shrinkSubtree(node: LayoutModel, totalDepth: number, registry: DepthRegistry): void {
  console.log(`shrinken ${node.name} ${node.postLayout.totalWidth - SEPARATION} from depth ${node.layout.depth}.`);

  // update widths and mark shrunken nodes in registry
  const removedWidth = node.postLayout.totalWidth - SEPARATION;
  eachBefore(node, child => registry.get(child.layout.depth)!.shrunk.set(child.idPath, true));
  for (let i = node.layout.depth; i < totalDepth; i++) {
    registry.get(i)!.totalWidth -= removedWidth;
  }

  // replace children with virtual nodes
  node.layout.radialX = node.layout.x = node.postLayout.shrunkLeftXPos + SEPARATION;
  let temp = node;
  node.links = [];

  for (let i = node.layout.depth + 2; i < totalDepth; i++) {
    const virt = GraphFactory.createModel({ name: node.name, nestLevel: i, path: node.idPath }, 0, temp, 'virtual');
    virt.layout.radialX = node.layout.x;
    virt.layout.radialY = virt.layout.depth * RADIUS;
    temp.children = [virt];
    temp.links.push(GraphFactory.createLinkModel(temp, virt));
    temp = virt;
  }
}
