import { layout } from './layout/tree.ts';
import { NodeModel, RawNode, GraphModel, LinkModel } from './types.ts';

export class Graph {
  model = { //: GraphModel
    nodes: [] as NodeModel[],
    links: [] as LinkModel[],
  };

  parseJson(json: RawNode): void {
    // outputs the same tree but with added properties
    const { nodes, links } = this.model;
    const result = this.createNodeModel(json, 0, null);
    const stack = [json];
    json._modelRef = result;
    nodes.push(result);

    while (stack.length) {
      const rawNode = stack.pop()!;
      const node = rawNode._modelRef!;
      const rawChildren = rawNode.children || [];
      for (let i = rawChildren.length - 1; i >= 0; --i) { // iterate from end to avoid resizing array i times
        const childNode = this.createNodeModel(rawChildren[i], i, node);
        rawChildren[i]._modelRef = childNode;
        node.children[i] = childNode;
        stack.push(rawChildren[i]);
        nodes.push(childNode);
        links.push(this.createLinkModel(node, childNode));
      }
    }
    (result.parent = this.createNodeModel({} as any, 0, null)).children = [result];
    layout(result);
    console.log(result)
  }

  private createNodeModel(data: RawNode, index: number, parent: NodeModel | null): NodeModel {
    const model = {
      name: data.name,
      nestLevel: data.nestLevel,
      idPath: data.path,
      parent,
      children: [],
      layout: {
        x: 0,
        y: 0,
        layoutX: 0,
        layoutY: 0,
        depth: parent ? parent.layout.depth + 1 : 0,
        A: null,
        a: null as unknown as NodeModel,
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

  private createLinkModel(source: NodeModel, target: NodeModel): LinkModel {
    return { source, target };
  }
}
