import { eachBefore } from './tidy-tree.ts';
import { NodeModel, RadialModel } from '../types.ts';
import { EjectNodeDiameter, LayoutFactory } from './layout-factory.ts';

export function ProcessEjects(radial: RadialModel, availableWidth: (depth: number) => number): NodeModel[] {
  console.log(`Processing Ejects for ${radial.rootId}`);
  const ejectedNodesMap = new Set<NodeModel>();
  const radialRoot = radial.children.get(radial.rootId)!;

  const depthEntry = { nodes: [...radialRoot.children], totalWidth: radialRoot.totalWidth, depth: 1 };

  while (depthEntry.nodes.length) {
    // TODO extract to separate method, use for angles eject
    const { nodes, totalWidth } = depthEntry;
    const depth = nodes[0].depth;
    const available = availableWidth(depth);
    const widthToRemove = Math.max(0, totalWidth - available);
    console.log(`${depth}. available: ${available}, taken: ${totalWidth}, toRemove: ${widthToRemove}`);

    if (widthToRemove) {
      pickNodesToEject(nodes, widthToRemove).forEach(eject => {
        ejectedNodesMap.add(eject);
        ejectNode(eject, radial);
      });
    }

    // load next depth nodes
    depthEntry.nodes = [];
    depthEntry.totalWidth = 0;
    depthEntry.depth = depthEntry.depth + 1;
    nodes.forEach(node => {
      if (node.isEjected) {
        return;
      }
      node.children.forEach(child => {
        if (!child.isEjected) {
          depthEntry.nodes.push(child);
          depthEntry.totalWidth += child.totalWidth || child.diameter; // if its leaf node then use its width instead
        }
      });
    });
  }
  console.log('\n');

  // mark ejects and pull them to the last depth
  const newTotalDepth = depthEntry.depth;
  for (const node of Array.from(ejectedNodesMap.values())) {
    let temp = node;
    for (let i = node.depth + 1; i < newTotalDepth; i++) {
      const virtual = LayoutFactory.createNode(temp.ref, '', temp.radialId, temp, { isVirtual: true });
      temp.children = [virtual];
      temp = virtual;
    }
  }
  return Array.from(ejectedNodesMap);
}

export function pickNodesToEject(allNodes: NodeModel[], widthToRemove: number): NodeModel[] {
  const nodesToRemove: NodeModel[] = [];
  let partialToRemove: NodeModel | null = null;
  let tempRemainingWidth = widthToRemove;

  // sorts from largest to smallest subtrees
  allNodes.sort((a, b) => b.totalWidth - a.totalWidth);

  for (let i = 0; i < allNodes.length; i++) {
    const child = allNodes[i];
    const widthSavings = child.totalWidth !== child.diameter ? child.totalWidth - EjectNodeDiameter : 0;
    if (widthSavings <= 0) {
      continue; // replacing this node won't decrease total width, so skip
    }
    // if node is less than the necessary width to remove, then remove node
    if (widthSavings <= tempRemainingWidth) {
      nodesToRemove.push(child);
      tempRemainingWidth -= widthSavings;
      continue;
    }
    partialToRemove = child;
    break;
  }

  if (partialToRemove) {
    // recursion
    const partialChildren = partialToRemove.children.filter(c => !c.isEjected);
    const childrenToRemove = pickNodesToEject(partialChildren, tempRemainingWidth);
    // if no children removal is enough, remove partial node itself
    if (!childrenToRemove.length) {
      nodesToRemove.push(partialToRemove);
    } else {
      nodesToRemove.push(...childrenToRemove);
    }
  }

  return nodesToRemove;
}

export function ejectNode(eject: NodeModel, radial: RadialModel) {
  eject.markAsEjected();
  // removes child from the old RadialModel and clear its layout data
  eachBefore(eject, c => {
    if (c === eject) return;
    radial.children.delete(c.id);
    c.resetLayout();
  });
  eject.children = [];
}
