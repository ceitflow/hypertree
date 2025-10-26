import { Graph } from '../graph.ts';
import { LayoutFactory } from './layout-factory.ts';
import { RadialsLayout } from './radials-layout.ts';
import { ProcessEjects } from './radials-ejector.ts';
import { eachBefore, TidyTree } from './tidy-tree.ts';

export function Layout(graph: Graph) {
  const root = graph.getRootRadial();
  if (!root) {
    return;
  }
  const stack = [root];

  while (stack.length) {
    // todo each Root instantiates Layout with own radius
    const radial = stack.pop()!;
    const root = radial.children.get(radial.rootId)!;
    console.log('Processing RadialModel ', radial);

    /* First layout run */
    TidyTree(root, { mode: 'horizontal' });

    /* Post-processing */
    ProcessEjects(radial).forEach(eject => {
      const newRoot = LayoutFactory.createNode(eject.ref, eject.id, eject.id, eject, { depth: 0 });
      const newRadial = graph.createRadialWithChildren(newRoot, newRoot.parent);
      radial.ejectedRadials.set(newRadial.rootId, newRadial);
      stack.push(newRadial);
    });

    /* Rerun layout and calculate radial positions this time */
    // todo here can compute auto radius for best layout look
    eachBefore(root, c => c.resetLayout());
    TidyTree(root, { mode: 'radial' });
  }

  RadialsLayout(root);
}
