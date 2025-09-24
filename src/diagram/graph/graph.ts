import { Layout } from './layout/layout.ts';
import { LayoutModel, RawProgramGraph, RawDir, GraphModel, LinkModel, RawFile, RawFileNode } from './types.ts';

export class Graph {
  model: GraphModel = {
    root: null, // recursive tree
  };

  parseJson(program: RawProgramGraph): void {
    // outputs the same tree but with added properties
    const json = program.dirGraph.dirs!.find(c => c.name === 'src')!.dirs!.find(c => c.name === 'app')!;
    const result = this.createModel(json, 0, null);
    (result.parent = this.createModel({} as any, 0, null)).children = [result];
    if (json.files)
      json.files.forEach((f, i) => {
        const file = this.createFileModel(f, program.files[f.path], i, result);
        result.links.push(this.createLinkModel(result, file));
        result.children.push(file);
      });
    const stack = [json];
    json._modelRef = result;
    this.model.root = result;

    while (stack.length) {
      const rawNode = stack.pop()!;
      const parentModel = rawNode._modelRef!;
      const rawDirs = rawNode.dirs || [];
      const cidx = parentModel.children.length;
      for (let i = 0; i < rawDirs.length; i++) {
        const rawDir = rawDirs[i];
        const childModel = this.createModel(rawDir, cidx + i, parentModel);
        if (rawDir.files && rawDir.name !== 'node_modules') {
          rawDir.files.forEach((f, idx) => {
            const file = this.createFileModel(f, program.files[f.path], idx, childModel);
            childModel.links.push(this.createLinkModel(childModel, file));
            childModel.children.push(file);
          });
        }
        rawDir._modelRef = childModel;
        parentModel.children.push(childModel);
        stack.push(rawDir);
        parentModel.links.push(this.createLinkModel(parentModel, childModel));
      }
    }
    Layout(result);
    console.log(result);
  }

  private createModel(
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
      clearLayoutDataRecursively: (parent: LayoutModel | null, idx: number) => {
        model.layout = this.createModelLayoutData(parent, idx);
        model.layout.ancestor = model;
        model.children.forEach((c, i) => c.clearLayoutDataRecursively(model, i));
      },
    };
    model.clearLayoutDataRecursively(modelParent, index);
    return model;
  }

  private createModelLayoutData = (parent: LayoutModel | null, index: number): LayoutModel['layout'] => {
    return {
      // layout inside circle data
      x: 0,
      y: 0,
      depth: parent ? parent.layout.depth + 1 : 0,
      angle: 0,
      radialX: 0,
      radialY: 0,

      // global layout data
      isCircleRoot: false,
      isVirtual: false,
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

  private createFileModel(data: RawFile, node: RawFileNode, index: number, parent: LayoutModel | null): LayoutModel {
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

  private createLinkModel(source: LayoutModel, target: LayoutModel): LinkModel {
    return { source, target };
  }

  // public getAllNodes(): [] {}
}
