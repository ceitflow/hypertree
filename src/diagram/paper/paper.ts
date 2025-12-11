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
    const container = new Container({
      label: root.name,
      x: 0,
      y: 0,
    });
    const stack = [root];

    while (stack.length) {
      const n = stack.pop()!;
      stack.push(...n.children);
      const isRoot = n === root;
      let nodeGraphic: Graphics;
      // if (!isRoot && n.ref.type === 'directory' && n.childrenDepth !== 1) continue;

      if (isRoot) {
        nodeGraphic = PaperFactory.createFileGraphics(n);
        const stats = graph.program.stats;
        const label =
          n.name + ' files: ' + stats.filesCount + ' external: ' + stats.externalFilesCount + ' LOC: ' + stats.totalLoc;
        container.addChild(PaperFactory.createLabel(0, 0, 0, label, true));
      } else {
        nodeGraphic = PaperFactory.createFileGraphics(n);
        n.labelPoints.forEach(p => {
          container.addChild(PaperFactory.createLabel(p[0], p[1], p[2], n.ref.type === 'directory' ? n.id : n.name, false));
        });
      }

      nodeGraphic.on('pointerdown', e =>
        console.log(
          `depth: ${n.depth} x:${n.x} y: ${n.y} L: ${n.spiralLength} 
          loc: ${n.ref.node['loc']} width: ${n.width}
          range: ${n.range[0].spiralLength}-${n.range[1].spiralLength}`,
          n.ref.node['exports'],
          n
        )
      );
      container.addChild(nodeGraphic);
    }

    return container;
  }
}
