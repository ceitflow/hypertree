import {
  CodeGraphNode,
  DeclarationGraphNode,
  DirectoryGraphNode,
  GraphNode,
  OtherGraphNode,
  VirtualGraphNode
} from './nodes';
import mitt from 'mitt';
import { Layout } from './layout/layout';
import { Directory, NodeEnum } from '@lib/ast';

type GraphModel = {
  root: DirectoryGraphNode;
};

export class Graph {
  model: GraphModel;
  layout: Layout;
  emit = mitt<{ select: GraphNode | null }>();

  constructor(astRoot: Directory) {
    const root = this.initialize(astRoot);
    this.layout = new Layout(root);

    this.model = {
      root
    };
  }

  private initialize(root: Directory): DirectoryGraphNode {
    const rootNode = DirectoryGraphNode.create(null, root);

    const stack: { dir: Directory; parentNode: GraphNode }[] = [{ dir: root, parentNode: rootNode }];

    while (stack.length > 0) {
      const { dir, parentNode } = stack.pop()!;

      for (const subdir of dir.dirs) {
        const dirNode = DirectoryGraphNode.create(parentNode, subdir);
        parentNode.children.push(dirNode);
        stack.push({ dir: subdir, parentNode: dirNode });
      }

      if (dir.files.length > 0) {
        const virtualNode = VirtualGraphNode.create(parentNode, false);

        for (const file of dir.files) {
          let fileNode: GraphNode;
          if (file.type === NodeEnum.Code) {
            fileNode = CodeGraphNode.create(virtualNode, file);
            fileNode.children = DeclarationGraphNode.createFromCodeFile(fileNode);
          } else {
            fileNode = OtherGraphNode.create(virtualNode, file);
          }
          virtualNode.children.push(fileNode);
        }
        parentNode.children.push(virtualNode);
      }
    }
    return rootNode;
  }
}
