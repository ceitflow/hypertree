import { tidyLayout } from './layout/tree.ts';
import { DirModel, RawDir, GraphModel, LinkModel, FileModel, RawFile } from './types.ts';

export class Graph {
  model: GraphModel = {
    nodes: [],
    links: [],
  };

  parseJson(json: RawDir): void {
    // outputs the same tree but with added properties
    const { nodes, links } = this.model;
    const result = this.createDirModel(json, 0, null);
    if (json.files) json.files.forEach(f => result.files.push(this.createFileModel(f)))
    const stack = [json];
    json._modelRef = result;
    nodes.push(result);

    while (stack.length) {
      const rawNode = stack.pop()!;
      const node = rawNode._modelRef!;
      const rawDirs = rawNode.dirs || [];
      for (let i = rawDirs.length - 1; i >= 0; --i) { // iterate from end to avoid resizing array i times
        const dir = rawDirs[i];
        const childDirModel = this.createDirModel(dir, i, node);
        dir._modelRef = childDirModel;
        node.dirs[i] = childDirModel;
        stack.push(dir);
        nodes.push(childDirModel);
        links.push(this.createLinkModel(node, childDirModel));
        dir.files?.forEach(file => {
          childDirModel.files.push(this.createFileModel(file));
        })
      }
    }
    (result.parent = this.createDirModel({} as any, 0, null)).dirs = [result];
    tidyLayout(result);
    console.log(result)
  }

  private createDirModel(data: RawDir, index: number, parent: DirModel | null): DirModel {
    const model: DirModel = {
      name: data.name,
      nestLevel: data.nestLevel,
      idPath: data.path,
      parent,
      files: [],
      dirs: [],
      layout: {
        x: 0,
        y: 0,
        angle: 0,
        angleAdjustment: 0,
        radialX: 0,
        radialY: 0,
        depth: parent ? parent.layout.depth + 1 : 0,
        A: null,
        a: null as unknown as DirModel,
        z: 0,
        m: 0,
        c: 0,
        s: 0,
        t: null,
        i: index,
      },
    };
    model.layout.a = model;
    return model;
  }

  private createFileModel(data: RawFile): FileModel {
    return {
      idPath: data.path,
      name: data.name,
      nestLevel: data.nestLevel,
      layout: {
        angle: 0,
        angleAdjustment: 0,
        radialX: 0,
        radialY: 0,
      }
    }
  }

  private createLinkModel(source: DirModel, target: DirModel): LinkModel {
    return { source, target };
  }
}
