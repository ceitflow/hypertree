import { LayoutModel } from '../types.ts';
import { eachAfter, eachBefore, RADIUS, SEPARATION } from './tidy-tree.ts';

export function RecalculateTreeEjector(root: LayoutModel, totalDepth: number) {
  // for (depth in diagram.depths)
  //   get leftNeighbour.x
  //   Math.min of all depth distances to neighbour = new position
  // then for all nodes to the right of replaced subtree
  //  - start with replaced tree parent and shift its right children
  // - then traverse up parent and shift if needed (?)
  //
  // OR
  // for each subtree to the right just repeat the same process
  // - foreach depth calculate distance and take the min distance
  // - move this subtree
  // - then repeat or all remaining nodes to the right
  // - profit

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

    if (!node.children.length) {
      postLayout.virtualNodesToBottom = [];
      for (let i = currentDepth + 1; i < totalDepth; i++) {
        postLayout.virtualNodesToBottom.push(tempLeftNeighbors[i]); // can ask its rightNeighbor to get right side
      }
      return;
    }

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
    postLayout.leftMost = leftMost;
    postLayout.rightMost = rightMost;
    postLayout.totalWidth = rightMost.layout.x - leftMost.layout.x;
  });

  root.postLayout.depthsLeftRightNodes.forEach((depth, idx) => {
    const available = (2 * Math.PI * RADIUS) * (idx + 1);
    const taken = depth[1].layout.x - depth[0].layout.x;
    console.log(`${idx}. available: ${available}, taken: ${taken}`);
  })

  // TODO controllable overlaps, trace left and right contour of subtree and add virtual nodes all the way to the bottom
}

function shrinkSubtree(node: LayoutModel) {
  // all nodes to the right need to adjust
  // find all touching neighbors
  // todo for all depths pick x pos which is rightmost

  // todo virtualNodes too
  // root.postLayout.depthsLeftRightNodes[currentDepth][0]; // get right neighbour if no left neighbour present (gets leftmost node in current depth)
  let targetX = -Infinity;
  node.postLayout.depthsLeftRightNodes.forEach(([leftmost]) => {
    const leftNeighbor = leftmost.postLayout.leftNeighbour;
    if (leftNeighbor && leftNeighbor.layout.x > targetX) targetX = leftNeighbor.layout.x;
  });
  console.log(`${node.idPath} new x pos is ${targetX + 10}`);
}
