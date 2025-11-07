import { NodeModel, RadialModel, IdPath } from '../types.ts';

type NodeFactoryOpt = Partial<Omit<NodeModel, 'id' | 'radialId' | 'ref' | 'parent' | 'resetLayout'>>;
type RadialFactoryOpt = Partial<Omit<RadialModel, 'rootId' | 'parentNode'>>;

export const NodeDiameter = 12;
export const EjectNodeDiameter = 6;

export class LayoutFactory {
  static createNode(
    ref: NodeModel['ref'],
    id: IdPath,
    radialId: IdPath,
    parent: NodeModel | null,
    opt: NodeFactoryOpt = {}
  ): NodeModel {

    const model: NodeModel = {
      id,
      name: ref.node.name,
      radialId,
      ref,
      i: parent ? parent.children.length : 0,
      diameter: NodeDiameter,

      isMainRoot: false,
      isVirtual: false,
      isEjected: false,

      parent,
      children: [],
      depth: parent ? parent.depth + 1 : 0,

      x: 0, // tidy tree produces x positions only
      y: 0,
      Ancestor: null,
      ancestor: null as unknown as NodeModel,
      prelim: 0,
      mod: 0,
      change: 0,
      shift: 0,
      thread: null,
      angle: 0,
      angleAdjustment: 0,
      polarX: 0,
      polarY: 0,
      totalWidth: 0,
      resetLayout: () => {
        model.x = 0;
        model.y = 0;
        model.Ancestor = null;
        model.ancestor = model;
        model.prelim = 0;
        model.mod = 0;
        model.change = 0;
        model.shift = 0;
        model.thread = null;
        model.angleAdjustment = 0;
        model.polarX = 0;
        model.polarY = 0;
        model.totalWidth = 0;
      },
      markAsEjected: () => {
        model.isEjected = true;
        model.diameter = EjectNodeDiameter;
        let temp = model.parent;
        while (temp) {
          temp.totalWidth -= model.totalWidth;
          temp = temp.parent;
        }
        model.totalWidth = 0;
      },
      calculatePolar: (fullWidth, sep) => {
        const fullCircle = 2 * Math.PI;
        const kx = fullCircle / fullWidth;
        model.angle = ((model.x + model.angleAdjustment - sep) * kx - Math.PI / 2) % fullCircle; // radians
        model.polarX = model.y * Math.cos(model.angle);
        model.polarY = model.y * Math.sin(model.angle);
      },
      ...opt,
    };
    model.ancestor = model;
    return model;
  }

  static createRadial(root: NodeModel, parentNode: NodeModel | null, opt: RadialFactoryOpt = {}): RadialModel {
    const model: RadialModel = {
      rootId: root.id,
      parentNode,
      children: new Map([[root.id, root]]),
      ejectedRadials: new Map(),
      x: 0,
      y: 0,
      depth: 0,
      radius: 0,
      selfRadius: 0,
      ...opt
    };
    return model;
  }

  // todo implement for unit tests
  /*static createMockProgram(): RawProgramGraph {
    return {
      name: 'mock-program',
      filesMap: {},
      dirGraph: {
        name: 'src',
        path: '/src',
        depth: 0,
        dirs: [],
      },
    };
  }*/
}
