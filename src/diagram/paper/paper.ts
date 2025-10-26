import { Graph } from '../graph/graph.ts';
import { createEngine } from './engine.ts';
import { RadialModel } from '../graph/types.ts';
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
    const background = new Graphics({ interactive: true, eventMode: 'static', parent: engine.stage })
      .rect(0, 0, width, height)
      .fill('0x333');
    const paper = new Container({ parent: engine.stage });
    const viewport = CreateViewport(engine, paper); // todo Observe scale change (there will be LOD controller)
    return new Paper(graph, engine, paper, background, viewport);
  }

  reload(): void {
    const root = this.graph.getRootRadial();
    if (!root) return;

    let rootContainer!: Container;
    const stack = [root];
    while (stack.length) {
      const radialData = stack.pop()!;
      const container = this.renderRadial(radialData);
      if (!rootContainer) rootContainer = container;
      else rootContainer.addChild(container);
      radialData.ejectedRadials.forEach(child => stack.push(child));
    }

    const dx = rootContainer.width / 2;
    const dy = rootContainer.height / 2;
    rootContainer.children.forEach(c => {
      c.x += dx;
      c.y += dy;
    });
    this.scroller.transformer.updateExtentArea({ x: 0, y: 0, width: rootContainer.width, height: rootContainer.height });
    this.paper.addChild(rootContainer);
  }

  private renderRadial(radial: RadialModel): Container {
    const linksContainer = new Container({ label: 'links' });
    const textContainer = new Container({ label: 'text' });
    const nodesContainer = new Container({ label: 'nodes' });
    const container = new Container({
      children: [linksContainer, textContainer, nodesContainer],
      label: radial.rootId,
      x: radial.x,
      y: radial.y,
    });
    const stack = [radial.children.get(radial.rootId)!];

    while (stack.length) {
      const node = stack.pop()!;
      const structuralLinks = node.children.map(c => ({ source: node, target: c }));

      structuralLinks.forEach(link => linksContainer.addChild(PaperFactory.createLink(link)));
      nodesContainer.addChild(PaperFactory.createCircle(node));
      textContainer.addChild(PaperFactory.createLabel(node));

      stack.push(...node.children);
    }

    return container;
  }
}
