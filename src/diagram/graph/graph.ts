import { Layout } from './layout/layout.ts';
import { LayoutModel, RawDir, GraphModel, LinkModel, RawFile } from './types.ts';

export class Graph {
  model: GraphModel = {
    root: null, // recursive tree
  };

  parseJson(json: RawDir): void {
    // outputs the same tree but with added properties
    const result = this.createModel(json, 0, null);
    (result.parent = this.createModel({} as any, 0, null)).children = [result];
    if (json.files)
      json.files.forEach((f, i) => {
        const file = this.createFileModel(f, i, result);
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
            const file = this.createFileModel(f, idx, childModel);
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
    data: RawDir,
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
        model.layout = this.createModelLayoutData(parent, idx)
        model.layout.a = model;
        model.children.forEach((c, i) => c.clearLayoutDataRecursively(model, i));
      },
    };
    model.clearLayoutDataRecursively(modelParent, index);
    return model;
  }

  private createModelLayoutData = (parent: LayoutModel | null, index: number) => {
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
      A: null,
      a: null as unknown as LayoutModel,
      z: 0,
      m: 0,
      c: 0,
      s: 0,
      t: null,
      i: index,
    };
  };

  private createFileModel(data: RawFile, index: number, parent: LayoutModel | null): LayoutModel {
    const m = this.createModel(data, index, parent, 'file');
    // m.children = [this.createModel(data, 0, m)];
    // this.model.nodes.push(m.children[0]);
    // this.model.links.push(this.createLinkModel(m, m.children[0]))
    return m;
  }

  private createLinkModel(source: LayoutModel, target: LayoutModel): LinkModel {
    return { source, target };
  }

  // public getAllNodes(): [] {}
}
