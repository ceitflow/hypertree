import mitt from 'mitt';
import { Directory, NodeEnum } from '@lib/ast';
import { GraphModel, GraphNode } from './graph.type';

export class Graph {
  model: GraphModel;
  readonly emit = mitt<{ select: null }>();

  constructor(astRoot: Directory) {
    const root = this.createGraphNodes(astRoot);

    this.model = {
      root
    };
  }

  private createGraphNodes(root: Directory): GraphNode {
    function makeGraphNode(ref: GraphNode['ref'], parent: GraphNode | null): GraphNode {
      return {
        ref,
        parent,
        children: [],
        area: 0,
        bbox: { x: 0, y: 0, width: 0, height: 0 },
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        labelPoints: []
      };
    }
    const rootNode = makeGraphNode(root, null);

    const stack: { dir: Directory; parentNode: GraphNode }[] = [{ dir: root, parentNode: rootNode }];

    while (stack.length > 0) {
      const { dir, parentNode } = stack.pop()!;

      for (const subdir of dir.dirs) {
        const dirNode = makeGraphNode(subdir, parentNode);
        parentNode.children.push(dirNode);
        stack.push({ dir: subdir, parentNode: dirNode });
      }

      if (dir.files.length > 0) {
        const virtualNode = makeGraphNode({ type: NodeEnum.Virtual }, parentNode);

        // group files into virtual GraphNode
        for (const file of dir.files) {
          const fileNode = makeGraphNode(file, virtualNode);
          if (file.type === NodeEnum.Code) {
            for (const e of file.exports) fileNode.children.push(makeGraphNode(e, fileNode));
          }
          virtualNode.children.push(fileNode);
        }
        parentNode.children.push(virtualNode);
      }
    }
    return rootNode;
  }
}
