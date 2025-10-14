import { LayoutModel } from '../types.ts';
import { GraphFactory } from '../graph-factory.ts';
import { eachAfter, RadialTree, RADIUS, TidyTree } from './tidy-tree.ts';
import { ProcessEjects, recalculatePostLayout } from './tree-ejector.ts';

export function Layout(root: LayoutModel, totalDepth: number) {
  console.log('root', root, `depth: ${totalDepth}`);
  addVirtualWallNodes(root, totalDepth);

  // run layout
  TidyTree(root);

  // post processing
  // ProcessEjects(root, totalDepth);

  // rerun layout after possible changes
  root.clearLayoutDataRecursively(root.parent, 0);
  const { left, right } = TidyTree(root);
  RadialTree(root, left, right);

  // debug
  console.log('\n')
  recalculatePostLayout(root, totalDepth);
  root.postLayout.depthsLeftRightNodes.forEach(([leftMost, rightMost], depth) => {
    console.log(`${depth}. available: ${2 * Math.PI * RADIUS * (depth + 1)}, taken: ${rightMost.layout.x - leftMost.layout.x}`);
  });
}

function addVirtualWallNodes(root: LayoutModel, totalDepth: number) {
  eachAfter(root, n => {
    // add Virtual nodes to leftmost and rightmost leaves
    const isLeaf = !n.children.length;
    const isLeftOrRight = n.layout.i === 0 || n.layout.i === n.parent!.children.length - 1;
    if (!isLeaf || !isLeftOrRight) {
      return;
    }
    let tempVirtualNode!: LayoutModel;
    for (let i = n.layout.depth + 1; i <= totalDepth; i++) {
      if (!tempVirtualNode) {
        tempVirtualNode = GraphFactory.createModel({ name: '', path: 'virt', nestLevel: i }, 0, n, 'virtual');
        n.children.push(tempVirtualNode);
        continue;
      }
      const c = GraphFactory.createModel({ name: '', path: 'virt', nestLevel: i }, 0, tempVirtualNode, 'virtual');
      tempVirtualNode.children.push(c);
      tempVirtualNode = c;
    }
  });
}
