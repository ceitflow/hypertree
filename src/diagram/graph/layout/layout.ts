import { LayoutModel } from '../types.ts';
import { RecalculateTreeEjector } from './tree-ejector.ts';
import { eachAfter, eachBefore, separation, TidyTree } from './tidy-tree.ts';
import { GraphFactory } from '../graph-factory.ts';

export function Layout(root: LayoutModel, totalDepth: number) {
  console.log(root, `depth: ${totalDepth}`);

  // add Virtual nodes to leftmost and rightmost leaves
  eachAfter(root, (n) => {
    if (n.children.length || n.type === 'virtual') return;
    if (n.layout.i !== 0 && n.layout.i !== n.parent!.children.length - 1) return;

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
  const { left, right } = TidyTree(root);
  RecalculateTreeEjector(root, totalDepth);

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
}