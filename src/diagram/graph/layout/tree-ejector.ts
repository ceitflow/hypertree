import { LayoutModel } from '../types.ts';
import { GraphFactory } from '../graph-factory.ts';
import { Radius, SEPARATION } from './tidy-tree.ts';

export type EjectMap = Map<LayoutModel, boolean>;

export function ProcessEjects(root: LayoutModel) {
  const ejectMap: EjectMap = new Map();
  const currDepthEntry = { nodes: [...root.children], totalWidth: root.layout.totalWidth, depth: 1 };

  while (currDepthEntry.nodes.length) {
    const { nodes, totalWidth } = currDepthEntry;
    const depth = nodes[0].layout.depth;
    const available = 2 * Math.PI * Radius(depth);
    const widthToRemove = Math.max(0, totalWidth - available);
    console.log(`${depth}. available: ${available}, taken: ${totalWidth}, toRemove: ${widthToRemove}`);

    if (widthToRemove) {
      pickNodesToEject(nodes, ejectMap, widthToRemove).forEach(child => {
        ejectMap.set(child, true);
        child.type = 'ejected';
        child.children = [];
        child.links = [];
        console.log(`ejected ${child.idPath} ${child.layout.totalWidth} from depth ${child.layout.depth}.`);
      });
    }
    currDepthEntry.nodes = [];
    currDepthEntry.totalWidth = 0;
    currDepthEntry.depth = currDepthEntry.depth + 1;

    nodes.forEach(node => {
      node.children.forEach(child => {
        if (ejectMap.has(child)) return;
        currDepthEntry.nodes.push(child);
        currDepthEntry.totalWidth += child.layout.totalWidth || SEPARATION; // if its leaf node then use its width instead
      });
    });
  }

  // pull ejected nodes to the last depth
  const newTotalDepth = currDepthEntry.depth;
  for (const node of ejectMap.keys()) {
    let temp = node;
    for (let i = node.layout.depth + 1; i < newTotalDepth; i++) {
      const ejected = GraphFactory.createModel({ name: node.name, nestLevel: i, path: node.idPath }, 0, temp, 'ejected');
      temp.children = [ejected];
      temp = ejected;
    }
    // single link from node to last rendered eject
    node.links.push(GraphFactory.createLinkModel(node, temp));
  }
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
    const partialChildren = partialToRemove.children.filter(c => !ejectMap.has(c));
    const childrenToRemove = pickNodesToEject(partialChildren, ejectMap, tempRemainingWidth);
    // if no children removal will be enough, remove partial node itself
    if (!childrenToRemove.length) nodesToRemove.push(partialToRemove);
    else nodesToRemove.push(...childrenToRemove);
  }

  return nodesToRemove;
}
