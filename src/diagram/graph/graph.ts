import { Radius } from './layout/tidy-tree.ts';
import { LayoutFactory } from './layout/layout-factory.ts';
import { IdPath, NodeModel, ProgramGraph, RadialModel } from './types.ts';

type GraphModel = {
  rootRadialId: IdPath;
  radialsMap: Map<IdPath, RadialModel>;
  program: ProgramGraph;
};

export class Graph {
  model: GraphModel | null = null;

  getRootRadial(): RadialModel | null {
    if (this.model) return this.model.radialsMap.get(this.model.rootRadialId)!;
    return null;
  }

  initialize(program: ProgramGraph) {
    const data = program.root //.dirs!.find(c => c.name === 'src')!//.dirs!.find(c => c.name === 'app')!; // todo for testing only
    const n_m_idx = data.dirs?.findIndex(d => d.name === 'node_modules') || -1;
    if (n_m_idx !== -1) data.dirs!.splice(n_m_idx, 1);
    this.model = {
      rootRadialId: data.path,
      radialsMap: new Map(),
      program,
    };
    const radialId = data.path;
    const root: NodeModel = LayoutFactory.createNode({ type: 'directory', node: data }, data.path, radialId, null, { isMainRoot: true });
    this.createRadialWithChildren(root, null);
  }

  createRadialWithChildren(root: NodeModel, parentNode: NodeModel | null): RadialModel {
    const radial = LayoutFactory.createRadial(root, parentNode, { x: root.polarX, y: root.polarY });

    let totalDepth = 0;
    const stack = [root];
    while (stack.length) {
      const node = stack.pop()!;

      // helper function
      const addChild = (ref: NodeModel['ref'], id: IdPath) => {
        const child = LayoutFactory.createNode(ref, id, node.radialId, node);
        node.children.push(child);
        stack.push(child);
        radial.children.set(child.id, child);
        if (child.depth > totalDepth) totalDepth = child.depth;
      };

      switch (node.ref.type) {
        case 'directory':
          node.ref.node.dirs?.forEach(dir => addChild({ type: 'directory', node: dir }, dir.path));
          node.ref.node.files?.forEach(file => addChild({ type: 'file', node: file }, file.id));
          break;
        case 'file':
          node.ref.node.exports.forEach(declaration => {
            const id = node.id + '-' + declaration.name;
            addChild({ type: 'declaration', node: declaration }, id);
          });
          break;
      }
    }

    this.model!.radialsMap.set(radial.rootId, radial);
    radial.depth = totalDepth;
    radial.radius = radial.selfRadius = Radius(totalDepth);
    return radial;
  }
}
