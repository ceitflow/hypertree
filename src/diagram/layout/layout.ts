import { LayoutModel } from '../graph/types.ts';
import { ProcessEjects } from './tree-ejector.ts';
import { eachBefore, TidyTree } from './tidy-tree.ts';
import { GraphFactory } from '../graph/graph-factory.ts';

// todo turn to classes
export function Layout(root: LayoutModel) {
  const stack = [root];
  root.isRoot = true;

  while (stack.length) {
    const node = stack.pop()!;
    console.log('root', node);

    /* First layout run */
    // todo each Root instantiates Layout with own radius?
    TidyTree(node, { radial: false });

    /* Post-processing */
    const ejects = ProcessEjects(node);
    eachBefore(node, n => {
      n.resetLayoutData(); // force recalculate layout
      if (ejects.has(n)) {
        stack.push(BuildRoot(n));
      }
    });

    TidyTree(node, { radial: true });
  }
}

function BuildRoot(node: LayoutModel): LayoutModel {
  const root = GraphFactory.createModel({ name: node.name, path: node.idPath }, 0, null, node.depthData, node.type);
  root.layoutDepth = 0;
  root.parent = GraphFactory.createModel({} as any, 0, null, -1);
  root.depthData = node.depthData;
  root.parent!.type = 'virtual';
  root.parent!.childrenData = [root];
  root.isRoot = true;
  node.childrenData.forEach(child => {
    root.childrenData.push(child);
    root.layoutChildren.push(child);
    child.parent = root;
  });
  eachBefore(root, (child) => {
    child.resetLayoutData();
    child.layoutDepth = child.parent ? child.parent.layoutDepth + 1 : 0;
  });
  node.ejectRoot = root;
  return root;
}
