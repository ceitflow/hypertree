import { LayoutModel } from '../types.ts';
import { eachBefore, separation, TidyTree } from './tidy-tree.ts';

export function Layout(root: LayoutModel) {
  // todo this is layout for single CircleNode

  // 1. check if radius has too many nodes
  // 2. replace too large subtrees with single nodes
  //
  root.layout.isCircleRoot = true;

  const { left, right } = TidyTree(root);

  // todo check for ejects
  // root.layout.depth root.children

  const sep = left === right ? 1 : separation(left, right) / 2; // extra separation to prevent overlaps on same levels (start and end nodes)
  const fullWidth = right.layout.x - left.layout.x + sep;
  console.log(`leftmost: ${left.name}, rightmost: ${right.name}, fullWidth: ${fullWidth}`);

  const fullCircle = 2 * Math.PI;
  const tx = sep - left.layout.x;
  const kx = fullCircle / fullWidth;

  eachBefore(root, ({ layout, name }: LayoutModel) => {
    layout.angle = (layout.x + tx) * kx; // radians
    // layout.radialX = layout.y * Math.cos(layout.angle - Math.PI / 2);
    // layout.radialY = (layout.y) * Math.sin(layout.angle - Math.PI / 2);
    layout.radialX = layout.x;
    layout.radialY = layout.y;
  });

  // const a = root.children.find(c => c.name === 'accflow');
  // if (a) {
  //   console.log(a)
  //   a.clearLayoutDataRecursively(null, 0);
  //   Layout(a);
  // }
}