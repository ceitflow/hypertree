import { LayoutModel } from '../graph/types.ts';
import { GraphFactory } from '../graph/graph-factory.ts';
import { Radius, SEPARATION } from './tidy-tree.ts';

export type EjectMap = Set<LayoutModel>;

export function ProcessEjects(root: LayoutModel): EjectMap {
  const ejectMap: EjectMap = new Set();
  const currDepthEntry = { nodes: [...root.layoutChildren], totalWidth: root.layout.totalWidth, depth: 1 };

  while (currDepthEntry.nodes.length) {
    const { nodes, totalWidth } = currDepthEntry;
    const depth = nodes[0].layoutDepth;
    const available = 2 * Math.PI * Radius(depth);
    const widthToRemove = Math.max(0, totalWidth - available);
    console.log(`${depth}. available: ${available}, taken: ${totalWidth}, toRemove: ${widthToRemove}`);

    if (widthToRemove) {
      pickNodesToEject(nodes, ejectMap, widthToRemove).forEach(child => {
        ejectMap.add(child);
        child.isEjected = true;
      });
    }
    currDepthEntry.nodes = [];
    currDepthEntry.totalWidth = 0;
    currDepthEntry.depth = currDepthEntry.depth + 1;

    nodes.forEach(node => {
      if (node.isEjected) return;
      node.layoutChildren.forEach(child => {
        if (ejectMap.has(child)) return;
        currDepthEntry.nodes.push(child);
        currDepthEntry.totalWidth += child.layout.totalWidth || SEPARATION; // if its leaf node then use its width instead
      });
    });
  }

  // mark ejects and pull them until the last depth
  const newTotalDepth = currDepthEntry.depth;
  for (const node of Array.from(ejectMap.values())) {
    let temp = node;
    for (let i = node.layoutDepth + 1; i < newTotalDepth; i++) {
      const ejected = GraphFactory.createModel({ name: node.name, path: node.idPath }, 0, temp, node.depthData, node.type);
      ejected.layoutDepth = i;
      ejected.isEjected = true;
      ejected.childrenData = node.childrenData;
      temp.layoutChildren = [ejected];
      temp = ejected;
    }
    // make sure ejects point to nodes on the edge of layout
    ejectMap.delete(node);
    ejectMap.add(temp);
  }
  return ejectMap;
}

function pickNodesToEject(allNodes: LayoutModel[], ejectMap: EjectMap, widthToRemove: number): LayoutModel[] {
  const nodesToRemove: LayoutModel[] = [];
  let partialToRemove: LayoutModel | null = null;
  let tempRemainingWidth = widthToRemove;

  // sorts from largest to smallest subtrees
  allNodes.sort((a, b) => b.layout.totalWidth - a.layout.totalWidth);

  for (let i = 0; i < allNodes.length; i++) {
    const child = allNodes[i];
    const width = child.layout.totalWidth;
    if (width <= SEPARATION) continue; // replacing single width node won't do anything, so continue
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
    const partialChildren = partialToRemove.layoutChildren.filter(c => !ejectMap.has(c));
    const childrenToRemove = pickNodesToEject(partialChildren, ejectMap, tempRemainingWidth);
    // if no children removal will be enough, remove partial node itself
    if (!childrenToRemove.length) nodesToRemove.push(partialToRemove);
    else nodesToRemove.push(...childrenToRemove);
  }

  return nodesToRemove;
}
