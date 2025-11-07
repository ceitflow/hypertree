import { Graph } from '../graph.ts';
import { LayoutFactory } from './layout-factory.ts';
import { ejectNode, pickNodesToEject, ProcessEjects } from './radials-ejector.ts';
import { NodeModel, RadialModel } from '../types.ts';
import { eachBefore, Radius, TidyTree } from './tidy-tree.ts';
import { RadialsLayout } from './radials-layout.ts';

export function Layout(graph: Graph) {
  const root = graph.getRootRadial();
  if (!root) {
    return;
  }
  const radialStack = [root];

  while (radialStack.length) {
    // todo each Root instantiates Layout with own radius
    const radial = radialStack.pop()!;
    const root = radial.children.get(radial.rootId)!;
    console.log('Processing RadialModel ', radial);

    /* First layout run */
    TidyTree(root, { mode: 'horizontal' });
return;
    /* Post-processing */
    const ejected = ProcessEjects(radial, d => Radius(d) * 2 * Math.PI);
    console.log('Ejected', ejected);
    ejected.forEach(eject => {
      radialStack.push(createRadialFromEject(eject, radial, graph));
    });

    /* Rerun layout and calculate radial positions this time */
    runRadialTree(root, radial);

    /* Post-processing */ // ejecting too wide angular ranges
    // check if there is a node that is taking more than half of total width (only 1 per radial can occur)
    const availableWidth = root.totalWidth / 2; // for single node

    // Todo not quite works, need to switch to cluster tree
    //  and need framework to work with polar angles, to be able to translate and mark reserved regions (like 50%, 25%, 10% etc)
    /*for (const n of root.children) {
      // if node is taking more than 180 deg of circle, eject it to fit
      if (n.totalWidth <= availableWidth) {
        continue;
      }
      let result = n;
      let temp: NodeModel | null = n;
      while (temp && temp.totalWidth > availableWidth) {
        for (const child of temp.children) {
          if (child.totalWidth > availableWidth) {
            result = child;
            temp = child;
            break;
          }
        }
        temp = null;
      }
      const w = result.totalWidth;
      let leftMostX = Infinity;
      let rightMostX = -Infinity;
      eachBefore(result, v => {
        if (v.x < leftMostX) leftMostX = v.x;
        if (v.x > rightMostX) rightMostX = v.x;
      });
      const markToRemove = pickNodesToEject([...result.children], w - availableWidth);
      console.log('too big node:', result, `${w}`, 'selected to remove:', markToRemove);

      markToRemove.forEach(eject => {
        ejectNode(eject, radial);
        radialStack.push(createRadialFromEject(eject, radial, graph));
      });
      runRadialTree(result, radial);
      const currentW = result.totalWidth;
      const xOffsetToCenter = (rightMostX - leftMostX - currentW) / 2;
      eachBefore(result, v => {
        v.x += xOffsetToCenter;
        v.calculatePolar(w, 0);
      });
      break;
    }*/
  }

  RadialsLayout(root);
}

function runRadialTree(root: NodeModel, radial: RadialModel) {
  let newMaxDepth = 0;
  eachBefore(root, c => {
    c.resetLayout();
    newMaxDepth = Math.max(newMaxDepth, c.depth);
  });
  radial.depth = newMaxDepth;
  radial.radius = radial.selfRadius = Radius(newMaxDepth);
  // todo here can compute auto radius for best layout look
  TidyTree(root, { mode: 'radial' });
}

function createRadialFromEject(eject: NodeModel, parent: RadialModel, graph: Graph) {
  const newRoot = LayoutFactory.createNode(eject.ref, eject.id, eject.id, eject, { depth: 0 });
  const newRadial = graph.createRadialWithChildren(newRoot, newRoot.parent);
  parent.ejectedRadials.set(newRadial.rootId, newRadial);
  return newRadial;
}
