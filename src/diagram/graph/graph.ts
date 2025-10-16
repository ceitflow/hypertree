import { Layout } from './layout/layout.ts';
import { GraphFactory } from './graph-factory.ts';
import { RawProgramGraph, GraphModel, RawFile, RawFileNode, LayoutModel } from './types.ts';

export class Graph {
  model: GraphModel = {
    root: null, // recursive tree
  };

  parseJson(program: RawProgramGraph): void {
    const json = program.dirGraph.dirs!.find(c => c.name === 'src')!.dirs!.find(c => c.name === 'app')!;
    const result = GraphFactory.createModel(json, 0, null);
    result.parent = GraphFactory.createModel({} as any, 0, null);
    result.parent!.type = 'virtual';
    result.parent!.depthData = result.parent!.layoutDepth = -1;
    result.parent!.childrenData = [result];

    const stack = [json];
    json._modelRef = result;
    this.model.root = result;

    while (stack.length) {
      const rawNode = stack.pop()!;
      const modelRef = rawNode._modelRef!;
      const childDirs = rawNode.dirs || [];
      const childrenCount = modelRef.childrenData.length;

      for (let i = 0; i < childDirs.length; i++) {
        const childDir = childDirs[i];
        const childModel = GraphFactory.createModel(childDir, childrenCount + i, modelRef);
        if (childDir.files && childDir.name !== 'node_modules') {
          childDir.files.forEach((f, idx) => {
            const childFile = this.createFileModel(f, program.files[f.path], idx, childModel);
            childModel.childrenData.push(childFile);
          });
        }
        childDir._modelRef = childModel;
        modelRef.childrenData.push(childModel);
        stack.push(childDir);
      }
      modelRef.layoutChildren = [...modelRef.childrenData];
    }
    Layout(result);
  }

  private createFileModel(data: RawFile, node: RawFileNode, index: number, parent: LayoutModel | null): LayoutModel {
    const file = GraphFactory.createModel(data, index, parent, 'file');

    node.exports.forEach((e, i) => {
      const declaration = GraphFactory.createModel(
        {
          name: e.name,
          nestLevel: data.nestLevel + 1,
          path: `${data.path}//${e.name}`,
        },
        i,
        file,
        'declaration'
      );
      file.childrenData.push(declaration);
    });
    file.layoutChildren = [...file.childrenData];

    return file;
  }
}
