import { LayoutFactory } from './layout-factory.ts';
import { NodeModel, RadialModel } from '../types.ts';
import { Radius, SEPARATION, eachBefore } from './tidy-tree.ts';

export function ProcessEjects(radial: RadialModel): NodeModel[] {
  console.log(`Processing Ejects for ${radial.rootId}`)
  const ejectedNodesMap = new Set<NodeModel>();
  const radialRoot = radial.children.get(radial.rootId)!;

  const depthEntry = { nodes: [...radialRoot.children], totalWidth: radialRoot.totalWidth, depth: 1 };

  while (depthEntry.nodes.length) {
    const { nodes, totalWidth } = depthEntry;
    const depth = nodes[0].depth;
    const available = 2 * Math.PI * Radius(depth);
    const widthToRemove = Math.max(0, totalWidth - available);
    console.log(`${depth}. available: ${available}, taken: ${totalWidth}, toRemove: ${widthToRemove}`);

    if (widthToRemove) {
      pickNodesToEject(nodes, ejectedNodesMap, widthToRemove).forEach(eject => {
        ejectedNodesMap.add(eject);
        eject.isEjected = true;
        // removes child from the old RadialModel and clear its layout data
        eachBefore(eject, c => {
          if (c === eject) return;
          radial.children.delete(c.id);
          c.resetLayout();
        });
        eject.children = [];
      });
    }
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
          depthEntry.totalWidth += child.totalWidth || SEPARATION; // if its leaf node then use single node width instead
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
      const virtual = LayoutFactory.createNode(temp.ref, '', temp.radialId, temp, { isVirtual: true});
      temp.children = [virtual];
      temp = virtual;
    }
  }
  return Array.from(ejectedNodesMap);
}

function pickNodesToEject(allNodes: NodeModel[], ejectedNodesMap: Set<NodeModel>, widthToRemove: number): NodeModel[] {
  const nodesToRemove: NodeModel[] = [];
  let partialToRemove: NodeModel | null = null;
  let tempRemainingWidth = widthToRemove;

  // sorts from largest to smallest subtrees
  allNodes.sort((a, b) => b.totalWidth - a.totalWidth);

  for (let i = 0; i < allNodes.length; i++) {
    const child = allNodes[i];
    const width = child.totalWidth;
    if (width <= SEPARATION) {
      continue; // replacing single width node won't do anything, so skip
    }
    // if node is smaller than the necessary width to remove, this node will be removed
    if (width <= tempRemainingWidth) {
      nodesToRemove.push(child);
      tempRemainingWidth -= width - SEPARATION;
      continue;
    }
    partialToRemove = child;
    break;
  }
  if (partialToRemove) {
    const partialChildren = partialToRemove.children.filter(c => !ejectedNodesMap.has(c));
    const childrenToRemove = pickNodesToEject(partialChildren, ejectedNodesMap, tempRemainingWidth);
    // if no children removal will be enough, remove partial node itself
    if (!childrenToRemove.length) {
      nodesToRemove.push(partialToRemove);
    }
    else {
      nodesToRemove.push(...childrenToRemove);
    }
  }

  return nodesToRemove;
}
