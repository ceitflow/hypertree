import { PaperNode } from './types';
import { Factory } from './factory';
import { Graph, GraphNode } from '../../graph';
import { Application, Container, Graphics } from 'pixi.js';
import { CreateViewport, Mouse, ScreenType } from '../../shared/screen';

export class Paper {
  screen: ScreenType;
  container: {
    background: Graphics;
    paper: Container; // scrollable
  };

  constructor(
    private engine: Application,
    private graph: Graph
  ) {
    const { width, height } = engine.canvas.getBoundingClientRect();
    const background = new Graphics({ label: 'bg', interactive: true, parent: engine.stage, eventMode: 'dynamic' })
      .rect(0, 0, width, height)
      .fill('0x444');
    this.container = {
      background,
      paper: new Container({ label: 'paper', zIndex: 2, parent: engine.stage })
    };
    this.screen = CreateViewport(this.engine, this.container.paper, { zoom: { min: 0.03 } });

    // auto resize
    const resizeObserver = new ResizeObserver(entries => {
      const bbox = engine.canvas.getBoundingClientRect()
      this.screen.transformer.updateVisibleViewport(bbox);
      background.rect(0, 0, bbox.width, bbox.height).fill('0x444');
    });
    resizeObserver.observe(engine.canvas);

    this.reload();
    this.addEvents();
  }

  private reload(): void {
    const root = this.graph.model.root;
    if (!root) {
      return;
    }
    this.render(root);

    // center in viewport
    const { paper } = this.container;
    const dx = paper.width / 2;
    const dy = paper.height / 2;
    paper.children.forEach((c) => {
      c.x += dx;
      c.y += dy;
    });
    console.log('map size: ', paper.getSize());
    paper.pivot.set(paper.width / 2, paper.height / 2);
    this.screen.transformer.updateExtentArea({ x: 0, y: 0, width: paper.width, height: paper.height });
    this.screen.controller.zoom.zoomToFit();
  }

  private addEvents() {
    // scroller
    const { background, paper } = this.container;
    const mouse = Mouse(this.screen.controller);
    background.on('mousedown', mouse.mousedown);
    background.on('mousemove', mouse.mousemove);
    background.on('mouseup', mouse.mouseup);
    background.on('wheel', mouse.wheel);

    // todo clear on reloading
    let startX = 0;
    let startY = 0;
    let isDragging = false;
    let time = 0;
    const DRAG_THRESHOLD = 5; // pixels

    paper.children.forEach((c) => {
      c.on('pointerdowncapture', (e) => {
        mouse.mousedown(e as MouseEvent);
        isDragging = false;
        startX = e.clientX;
        startY = e.clientY;
        time = Date.now();
      });
      c.on('pointermove', (e) => {
        mouse.mousemove(e as MouseEvent);
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (dx * dx + dy * dy > DRAG_THRESHOLD * DRAG_THRESHOLD) {
          isDragging = true;
        }
      });
      c.on('pointerupcapture', (e) => {
        mouse.mouseup(e as MouseEvent);

        if (isDragging || Date.now() - time > 300) return;

        const n = (e.target as PaperNode).node;
        // this.graph.select(n.type === 'declaration' ? n.parent! : n); // todo paper select data
        console.log(n);
      });
      c.on('wheel', (e) => mouse.wheel(e as WheelEvent));
    });
  }

  private render(root: GraphNode) {
    const container = this.container.paper;
    container.removeChildren();
    const stack = [root];

    while (stack.length) {
      const n = stack.pop()!;
      stack.push(...n.children);
      const paperNode = Factory.createNode(n);
      const labels = Factory.createLabels(n);
      container.addChild(paperNode, ...labels);
    }
  }
}
