// read stored info in nodes about left and right threads
// todo run another linear loop through nodes
// foreach node
//   const depthWidth = node.children[node.children.length - 1].x - node.children[0].x

import { LayoutModel } from '../types.ts';
import { eachAfter } from './tidy-tree.ts';

export function TreeEjector(root: LayoutModel, totalDepth: number) {
  // todo test Collapse app/visualizer/diagram subtree

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

  const leftNeighbors: LayoutModel[] = new Array(totalDepth).fill(null); // [0] depth, [1] depth ...
  eachAfter(root, n => {
    const depth = n.layout.depth; // n.postLayout.virtualNodes
    if (leftNeighbors[depth]) {
      n.postLayout.leftNeighbour = leftNeighbors[depth];
      leftNeighbors[depth].postLayout.rightNeighbour = n;
    }
    leftNeighbors[depth] = n;
    if (!n.children.length) {
      n.postLayout.virtualNodesToBottom = [];
      for (let i = depth + 1; i < totalDepth; i++) {
        n.postLayout.virtualNodesToBottom.push(leftNeighbors[i]); // can ask its rightNeighbor to get right side
      }
      n.postLayout.depthsLeftRightNodes = [[n, n]]; // self is leftmost and rightmost node
    } else {
      eachAfter(n, (child) => {
        const idx = child.layout.depth - depth;
        const nDepths = n.postLayout.depthsLeftRightNodes[idx];
        if (!nDepths) {
          n.postLayout.depthsLeftRightNodes[idx] = [child, child];
          return;
        }
        if (child.layout.x < nDepths[0].layout.x) {
          nDepths[0] = child;
        }
        if (child.layout.x > nDepths[1].layout.x) {
          nDepths[1] = child;
        }
      });
    }
  });
}