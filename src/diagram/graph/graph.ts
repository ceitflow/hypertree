import { Layout } from './layout/layout.ts';
import { GraphFactory } from './graph-factory.ts';
import { RawProgramGraph, GraphModel } from './types.ts';

export class Graph {
  model: GraphModel = {
    root: null, // recursive tree
  };

  parseJson(program: RawProgramGraph): void {
    // outputs the same tree but with added properties
    const json = program.dirGraph.dirs!.find(c => c.name === 'src')!.dirs!.find(c => c.name === 'app')!;
    const result = GraphFactory.createModel(json, 0, null);
    result.layout.isCircleRoot = true;
    result.parent = GraphFactory.createModel({} as any, 0, null);
    result.parent!.type = 'virtual';
    result.parent!.layout.depth = -1;
    result.parent!.children = [result];
    if (json.files)
      json.files.forEach((f, i) => {
        const file = GraphFactory.createFileModel(f, program.files[f.path], i, result);
        result.links.push(GraphFactory.createLinkModel(result, file));
        result.children.push(file);
      });
    const stack = [json];
    json._modelRef = result;
    this.model.root = result;

    let totalDepth = 0;
    while (stack.length) {
      const rawNode = stack.pop()!;
      const parentModel = rawNode._modelRef!;
      totalDepth = Math.max(totalDepth, parentModel.layout.depth);
      const rawDirs = rawNode.dirs || [];
      const cidx = parentModel.children.length;
      for (let i = 0; i < rawDirs.length; i++) {
        const rawDir = rawDirs[i];
        const childModel = GraphFactory.createModel(rawDir, cidx + i, parentModel);
        if (rawDir.files && rawDir.name !== 'node_modules') {
          rawDir.files.forEach((f, idx) => {
            const file = GraphFactory.createFileModel(f, program.files[f.path], idx, childModel);
            childModel.links.push(GraphFactory.createLinkModel(childModel, file));
            childModel.children.push(file);
            totalDepth = Math.max(totalDepth, file.layout.depth, file.children.length ? file.layout.depth + 1 : 0);
          });
        }
        rawDir._modelRef = childModel;
        parentModel.children.push(childModel);
        stack.push(rawDir);
        parentModel.links.push(GraphFactory.createLinkModel(parentModel, childModel));
      }
    }
    Layout(result, totalDepth);
  }
  // public getAllNodes(): [] {}
}
