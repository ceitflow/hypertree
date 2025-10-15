import { LayoutModel } from '../types.ts';
import { RadialTree, RADIUS, TidyTree } from './tidy-tree.ts';
import { ProcessEjects, recalculatePostLayout } from './tree-ejector.ts';

// todo turn to classes
export function Layout(root: LayoutModel, totalDepth: number) {
  console.log('root', root, `depth: ${totalDepth}`);

  // run layout
  TidyTree(root, totalDepth);

  // post processing
  ProcessEjects(root, totalDepth);

  // rerun layout after possible changes
  root.clearLayoutDataRecursively(root.parent, 0);
  const { left, right } = TidyTree(root, totalDepth);
  RadialTree(root, left, right); // todo scale to avoid gaps if width < circle radius

  // debug
  recalculatePostLayout(root, totalDepth);
  console.log('\n')
  root.postLayout.depthsLeftRightNodes.forEach(([leftMost, rightMost], depth) => {
    console.log(`${depth}. available: ${2 * Math.PI * RADIUS * (depth + 1)}, taken: ${rightMost.layout.x - leftMost.layout.x}`);
  });
}
