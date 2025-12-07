import { Layout } from './layout/layout.ts';
import { NodeFactory } from './layout/node-factory.ts';
import { FileEnum, IdPath, NodeModel, ProgramGraph } from './types.ts';

type GraphModel = {
  root: NodeModel | null;
  program: ProgramGraph;
};

export class Graph {
  model: GraphModel | null = null;
  layout = new Layout();

  initialize(program: ProgramGraph) {
    const data = program.root; //.dirs!.find(c => c.name === 'src')!//.dirs!.find(c => c.name === 'app')!; // todo for testing only
    this.model = {
      root: null,
      program,
    };
    const root = NodeFactory.createNode({ type: 'directory', node: data }, data.path, null);
    this.model.root = root;

    const stack = [root];
    let totalDepth = 0;

    while (stack.length) {
      const node = stack.pop()!;

      const addChildToNode = (ref: NodeModel['ref'], id: IdPath) => {
        // helper function
        const child = NodeFactory.createNode(ref, id, node);
        node.children.push(child);
        stack.push(child);
        if (child.depth > totalDepth) totalDepth = child.depth;
        return child;
      };

      switch (node.ref.type) {
        case 'directory':
          node.ref.node.files?.forEach(file => {
            if (file.type === FileEnum.Code) addChildToNode({ type: 'codeFile', node: file }, file.id);
            else addChildToNode({ type: 'otherFile', node: file }, file.id);
          });
          node.ref.node.dirs?.forEach(dir => addChildToNode({ type: 'directory', node: dir }, dir.path));
          break;

        case 'codeFile':
          node.ref.node.exports.forEach(declaration => {
            const id = node.id + '-' + declaration.name;
            addChildToNode({ type: 'declaration', node: declaration }, id);
          });
          break;
      }
    }
  }

  runLayout() {
    if (this.model?.root) {
      this.layout.spiralLayout(this.model.root, true);
    }
  }
}
