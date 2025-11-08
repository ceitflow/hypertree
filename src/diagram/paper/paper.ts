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
    const background = new Graphics({ interactive: true, eventMode: 'dynamic', parent: engine.stage })
      .rect(0, 0, width, height)
      .fill('0x444');
    const paper = new Container({ parent: engine.stage });
    const viewport = CreateViewport(engine, paper); // todo Observe scale change (for LOD controller)
    return new Paper(graph, engine, paper, background, viewport);
  }

  reload(): void {
    const root = this.graph.getRootRadial();
    if (!root) return;

    const recursion = (data: RadialModel, parentContainer: Container | null) => {
      const container = this.renderRadial(data);
      parentContainer?.addChild(container);
      data.ejectedRadials.forEach(ejected => {
        // const regex = /^src\/app\/(visualizer|shared\/styles\/primeng-theme)$/; // todo for selectively rendering child radials
        // if (regex.test(ejected.rootId)) recursion(ejected, container);
        recursion(ejected, container);
      });
      return container;
    };
    const rootContainer = recursion(root, null);

    // center in viewport
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
    const graph = this.graph.model!;
    const linksContainer = new Container({ label: 'links' });
    const textContainer = new Container({ label: 'text' });
    const nodesContainer = new Container({ label: 'nodes' });
    const container = new Container({
      children: [linksContainer, nodesContainer, textContainer],
      label: radial.rootId,
      x: radial.x,
      y: radial.y,
    });
    // container.addChild(new Graphics().circle(0, 0, radial.selfRadius).stroke(0xff8888)); // todo debug only
    // container.addChild(new Graphics().circle(0, 0, radial.radius).stroke(0xff0000)); // todo debug only
    const stack = [radial.children.get(radial.rootId)!];

    while (stack.length) {
      const node = stack.pop()!;

      node.children.forEach(c => {
        const l = { source: node, target: c };
        linksContainer.addChild(PaperFactory.createLink(l.source.polarX, l.source.polarY, l.target.polarX, l.target.polarY));
      });
      const circle = PaperFactory.createNode(node);
      circle.on('pointerdown', e =>
        console.log(
          `a: ${node.angle < 0 ? node.angle + 2 * Math.PI : node.angle}, d: ${node.depth} x:${node.polarX} y: ${node.polarY}`,
          node,
          graph.radialsMap.get(node.radialId)
        )
      );
      nodesContainer.addChild(circle);
      if (node.isMainRoot) {
        const stats = graph.program.stats;
        const label =
          node.name + '\nfiles: ' + stats.filesCount + '\nexternal: ' + stats.externalFilesCount + '\nLOC: ' + stats.totalLoc;
        textContainer.addChild(PaperFactory.createLabel(30, -15, 0, label, true));
      } else {
        textContainer.addChild(
          PaperFactory.createLabel(node.polarX, node.polarY, node.angle, node.name, node.ref.type === 'directory')
        );
      }

      stack.push(...node.children);
    }

    return container;
  }
}
