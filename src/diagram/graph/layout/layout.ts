import { LayoutModel } from '../types.ts';
import { ProcessEjects } from './tree-ejector.ts';
import { eachBefore, RadialTree, TidyTree } from './tidy-tree.ts';

// todo turn to classes
export function Layout(root: LayoutModel, totalDepth: number) {
  console.log('root', root, `depth: ${totalDepth}`);

  // run layout
  TidyTree(root, totalDepth);

  // post processing
  ProcessEjects(root);

  // rerun layout after possible changes, finally calculate positions for radial layout
  eachBefore(root, n => n.resetLayoutData())
  const { left, right, map } = TidyTree(root, totalDepth);
  RadialTree(root, left, right, map);
}
