import {
  CodeGraphNode,
  DeclarationGraphNode,
  DirectoryGraphNode,
  GraphModel,
  GraphNode,
  OtherGraphNode,
  VirtualGraphNode
} from './nodes';
import mitt from 'mitt';
import { Edge } from './edges';
import { Layout } from './layout/layout';
import { Directory, IdPath, NodeEnum } from '@lib/ast';

export class Graph {
  model: GraphModel;
  layout: Layout;
  emit = mitt<{ select: GraphNode | null }>();

  constructor(astRoot: Directory) {
    this.model = this.initialize(astRoot);
    this.layout = new Layout(this.model);
  }

  private initialize(astRoot: Directory): GraphModel {
    const root = DirectoryGraphNode.create(null, astRoot);
    const edges = new Map<IdPath, Edge[]>();

    const stack: { dir: Directory; parentNode: GraphNode }[] = [{ dir: astRoot, parentNode: root }];

    // copy ast tree into graph node tree
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
            fileNode.ast.imports.forEach((imp) => {
              if (!edges.has(file.id)) edges.set(file.id, []);
              edges.get(file.id)!.push(Edge.create(imp, file.id, imp.from));
            });
          } else {
            fileNode = OtherGraphNode.create(virtualNode, file);
          }
          virtualNode.children.push(fileNode);
        }
        parentNode.children.push(virtualNode);
      }
    }
    return { root, edgesRegistry: edges };
  }
}
