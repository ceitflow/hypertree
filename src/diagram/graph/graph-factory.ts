import { LayoutModel, LinkModel, RawDir, RawFile, RawFileNode, RawProgramGraph } from './types.ts';

export class GraphFactory {
  static createModel(
    data: Pick<RawDir, 'name' | 'nestLevel' | 'path'>,
    index: number,
    modelParent: LayoutModel | null,
    type: LayoutModel['type'] = 'dir'
  ): LayoutModel {
    const model: LayoutModel = {
      name: data.name,
      nestLevel: data.nestLevel,
      idPath: data.path,
      type,
      parent: modelParent,
      children: [],
      links: [],
      layout: null as any,
      resetLayoutData: () => {
        const isRoot = model.layout?.isCircleRoot
        model.layout = this.createModelLayoutData(modelParent, index);
        model.layout.ancestor = model;
        model.layout.isCircleRoot = isRoot;
      },
    };
    model.resetLayoutData();
    return model;
  }

  static createModelLayoutData = (parent: LayoutModel | null, index: number): LayoutModel['layout'] => {
    return {
      // layout inside circle data
      x: 0,
      y: 0,
      totalWidth: 0,
      depth: parent ? parent.layout.depth + 1 : 0,
      angle: 0,
      radialX: 0,
      radialY: 0,
      angleAdjustment: 0,

      // global layout data
      isCircleRoot: false,
      radialXOffset: 0,
      radialYOffset: 0,

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

  static createFileModel(data: RawFile, node: RawFileNode, index: number, parent: LayoutModel | null): LayoutModel {
    const m = this.createModel(data, index, parent, 'file');
    node.exports.forEach((e, i) =>
      m.children.push(
        this.createModel(
          {
            name: e.name,
            nestLevel: data.nestLevel + 1,
            path: `${data.path}//${e.name}`,
          },
          i,
          m,
          'declaration'
        )
      )
    );
    // node.reexports.forEach((r, i) =>
    //   m.children.push(
    //     this.createModel(
    //       {
    //         name: r.token.name,
    //         nestLevel: data.nestLevel,
    //         path: `${data.path}//${r.token.name}`,
    //       },
    //       i,
    //       m,
    //       'declaration'
    //     )
    //   )
    // );
    m.children.forEach(c => m.links.push(this.createLinkModel(m, c)));
    return m;
  }

  static createLinkModel(source: LayoutModel, target: LayoutModel): LinkModel {
    return { source, target };
  }
  
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