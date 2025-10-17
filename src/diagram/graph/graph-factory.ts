import { LayoutModel, LinkModel, RawDir, RawProgramGraph } from './types.ts';

export class GraphFactory {
  static createModel(
    data: Pick<RawDir, 'name' | 'path'>,
    index: number,
    parent: LayoutModel | null,
    depth: number,
    type: LayoutModel['type'] = 'dir'
  ): LayoutModel {
    const model: LayoutModel = {
      name: data.name,
      idPath: data.path,
      type,
      parent,
      depthData: depth,
      childrenData: [],
      layout: null as any,
      isRoot: false,
      isEjected: false,
      ejectRoot: null,
      layoutDepth: depth,
      layoutChildren: [],
      resetLayoutData: () => {
        model.layout = this.createModelLayoutData(parent, index);
        model.layout.ancestor = model;
      }
    };
    model.resetLayoutData();
    return model;
  }

  static createModelLayoutData = (parent: LayoutModel | null, index: number): LayoutModel['layout'] => {
    return {
      x: 0,
      y: 0,
      totalWidth: 0,
      angle: 0,
      radialX: 0,
      radialY: 0,
      angleAdjustment: 0,

      // tidy tree temp data
      Ancestor: null,
      ancestor: null as unknown as LayoutModel,
      prelim: 0,
      mod: 0,
      change: 0,
      shift: 0,
      thread: null,
      i: index,
    };
  };

  static createLinkModel(source: LayoutModel, target: LayoutModel): LinkModel {
    return { source, target };
  }

  // todo for unit tests
  static createMockProgram(): RawProgramGraph {
    
    return {
      name: 'mock-program',
      files: {

      },
      dirGraph: {
        name: 'src',
        path: '/src',
        nestLevel: 0,
        dirs: [
          {
            name: 'components',
            path: '/src/components',
            nestLevel: 1,
          },
        ],
      },
    };
  }
}