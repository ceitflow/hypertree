import { Graph } from '../graph/graph.ts';
import { createEngine } from './engine.ts';
import { NodeModel } from '../graph/types.ts';
import { PaperFactory } from './paper-factory.ts';
import { CreateViewport, ScreenType } from './screen';
import { Application, Container, Graphics } from 'pixi.js';

export class Paper {
  private constructor(
    public graph: Graph,
    private engine: Application,
    private paper: Container,
    public background: Graphics,
    public scroller: ScreenType
  ) {}

  static async Create(host: HTMLElement) {
    const graph = new Graph();
    const engine = await createEngine(host);
    const { width, height } = host.getBoundingClientRect();
    const background = new Graphics({ interactive: true, eventMode: 'dynamic', parent: engine.stage })
      .rect(0, 0, width, height)
      .fill('0x444');
    const paper = new Container({ parent: engine.stage });
    const viewport = CreateViewport(engine, paper); // todo Observe scale change (for LOD controller)
    return new Paper(graph, engine, paper, background, viewport);
  }

  reload(): void {
    const root = this.graph.model?.root;
    if (!root) {
      return;
    }
    const rootContainer = this.renderTree(root);

    // center in viewport
    const dx = rootContainer.width / 2;
    const dy = rootContainer.height / 2;
    rootContainer.children.forEach(c => {
      c.x += dx;
      c.y += dy;
    });
    console.log(rootContainer.width, rootContainer.height);
    this.scroller.transformer.updateExtentArea({ x: 0, y: 0, width: rootContainer.width, height: rootContainer.height });
    this.paper.addChild(rootContainer);
  }

  private renderTree(root: NodeModel): Container {
    const graph = this.graph.model!;
    const linksContainer = new Container({ label: 'links' });
    const textContainer = new Container({ label: 'text' });
    const nodesContainer = new Container({ label: 'nodes' });
    const container = new Container({
      children: [linksContainer, nodesContainer, textContainer],
      label: root.name,
      x: 0,
      y: 0,
    });
    const stack = [root];

    while (stack.length) {
      const node = stack.pop()!;

      node.children.forEach(c => {
        const l = { source: node, target: c };
        linksContainer.addChild(PaperFactory.createLink(l.source.x, l.source.y, l.target.x, l.target.y));
      });
      const circle = PaperFactory.createNode(node);
      circle.on('pointerdown', e =>
        console.log(
          `a: ${node.angle < 0 ? node.angle + 2 * Math.PI : node.angle}, d: ${node.depth} x:${node.x} y: ${node.y}`,
          node
        )
      );
      nodesContainer.addChild(circle);
      if (node === root) {
        const stats = graph.program.stats;
        const label =
          node.name + '\nfiles: ' + stats.filesCount + '\nexternal: ' + stats.externalFilesCount + '\nLOC: ' + stats.totalLoc;
        textContainer.addChild(PaperFactory.createLabel(30, -15, 0, label, true));
      } else {
        textContainer.addChild(
          PaperFactory.createLabel(node.x, node.y, node.angle, node.name, node.ref.type === 'directory')
        );
      }

      stack.push(...node.children);
    }

    return container;
  }
}
