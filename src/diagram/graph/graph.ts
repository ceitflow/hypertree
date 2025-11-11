import { LayoutFactory } from './layout/layout-factory.ts';
import { FileEnum, IdPath, NodeModel, ProgramGraph } from './types.ts';

type GraphModel = {
  root: NodeModel | null;
  program: ProgramGraph;
};

export class Graph {
  model: GraphModel | null = null;

  initialize(program: ProgramGraph) {
    const data = program.root //.dirs!.find(c => c.name === 'src')!//.dirs!.find(c => c.name === 'app')!; // todo for testing only
    const n_m_idx = data.dirs?.findIndex(d => d.name === 'node_modules') || -1;
    if (n_m_idx !== -1) data.dirs!.splice(n_m_idx, 1);
    this.model = {
      root: null,
      program,
    };
    const root = LayoutFactory.createNode({ type: 'directory', node: data }, data.path, null);
    this.model.root = root;

    const stack = [root];
    let totalDepth = 0;

    while (stack.length) {
      const node = stack.pop()!;
      // helper function
      const addChildModel = (ref: NodeModel['ref'], id: IdPath) => {
        const child = LayoutFactory.createNode(ref, id, node);
        node.children.push(child);
        stack.push(child);
        if (child.depth > totalDepth) totalDepth = child.depth;
      };

      switch (node.ref.type) {
        case 'directory':
          node.ref.node.files?.forEach(file => {
            if (file.type === FileEnum.Code) addChildModel({ type: 'codeFile', node: file }, file.id);
            else addChildModel({ type: 'otherFile', node: file }, file.id);
          });
          node.ref.node.dirs?.forEach(dir => addChildModel({ type: 'directory', node: dir }, dir.path));
          break;
        case 'codeFile':
          node.ref.node.exports.forEach(declaration => {
            const id = node.id + '-' + declaration.name;
            addChildModel({ type: 'declaration', node: declaration }, id);
          });
          break;
      }
    }
  }
}
