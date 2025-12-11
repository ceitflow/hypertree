import { Spiral } from './layout/spiral.ts';
import { NodeFactory } from './layout/node-factory.ts';
import { Directory, FileEnum, NodeModel, ProgramGraph } from './types.ts';

type GraphModel = {
  root: NodeModel | null;
  program: ProgramGraph;
};

export class Graph {
  model: GraphModel | null = null;
  layout = new Spiral();

  initialize(program: ProgramGraph) {
    const data = program.root; //.dirs!.find(c => c.name === 'src')!//.dirs!.find(c => c.name === 'app')!; // todo for testing only
    this.model = {
      root: null,
      program,
      // todo keep reference to leaf nodes, so virtual nodes can be added fast
    };

    this.model.root = NodeFactory.createNode({ type: 'directory', node: data }, data.path, null);
    const stack: NodeModel[] = [this.model.root];

    while (stack.length) {
      const dirNode = stack.pop()!;
      const ref = dirNode.ref.node as Directory;

      if (ref.files?.length) {
        for (let i = 0; i < ref.files.length; i++) {
          const childRef = ref.files[i];
          const fileNode = NodeFactory.createNode(
            childRef.type === FileEnum.Code ? { type: 'codeFile', node: childRef } : { type: 'otherFile', node: childRef },
            childRef.id,
            dirNode
          );
          dirNode.children.push(fileNode);
        }
      }
      if (ref.dirs?.length) {
        for (let i = 0; i < ref.dirs.length; i++) {
          const childRef = ref.dirs[i];
          const child = NodeFactory.createNode({ type: 'directory', node: childRef }, childRef.path, dirNode);
          dirNode.children.push(child);
          stack.push(child);
        }
      }
    }
  }

  runLayout() {
    if (this.model?.root) {
      this.layout.spiralLayout(this.model.root);
    }
  }
}
