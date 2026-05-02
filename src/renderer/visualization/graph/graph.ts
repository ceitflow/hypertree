import {
  CodeGraphNode,
  DeclarationGraphNode,
  DirectoryGraphNode,
  GraphNode,
  OtherGraphNode,
  Edge,
  GraphData, GraphNodeEnum
} from './models';
import mitt from 'mitt';
import { Layout } from './layout/layout';
import { GraphNodeBase } from './models/base';
import { Directory, IdPath, NodeEnum } from '@lib/ast';

export class Graph {
  model: GraphData;
  layout: Layout;
  emit = mitt<{ select: GraphNode | null }>();

  constructor(astRoot: Directory) {
    this.model = this.initialize(astRoot);
    this.layout = new Layout(this.model);
  }

  private initialize(astRoot: Directory): GraphData {
    const nodes = new Map<IdPath, GraphNodeBase>();
    const edges = new Map<IdPath, Edge[]>(); // todo from and to, know total traffic for each node
    const root = DirectoryGraphNode.create(null, astRoot);
    nodes.set(root.ast.id, root);
    const stack: { dir: Directory; parentNode: DirectoryGraphNode }[] = [{ dir: astRoot, parentNode: root }];

    // copy ast tree into graph node tree
    while (stack.length > 0) {
      const { dir, parentNode } = stack.pop()!;

      for (const subdir of dir.dirs) {
        const dirNode = DirectoryGraphNode.create(parentNode, subdir);
        nodes.set(dirNode.ast.id, dirNode);
        parentNode.children.push(dirNode);
        stack.push({ dir: subdir, parentNode: dirNode });
      }

      if (dir.files.length) {
        for (const file of dir.files) {
          let fileNode: GraphNode;
          if (file.type === NodeEnum.Code) {
            fileNode = CodeGraphNode.create(parentNode, file);
            fileNode.children = DeclarationGraphNode.createFromCodeFile(fileNode);
            fileNode.ast.imports.forEach((imp) => {
              if (!edges.has(file.id)) edges.set(file.id, []);
              edges.get(file.id)!.push(Edge.create(imp, file.id, imp.from));
            });
          } else {
            fileNode = OtherGraphNode.create(parentNode, file);
          }
          nodes.set(fileNode.ast.id, fileNode);
          fileNode.children.forEach((c) => {
            if (c.type === GraphNodeEnum.Declaration) nodes.set(c.ast.id, c);
          });
          parentNode.children.push(fileNode);
        }
      }
    }

    return { root, edgesRegistry: edges, nodes };
  }
}
