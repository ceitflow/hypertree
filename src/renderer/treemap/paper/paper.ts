import { Store } from '../store';
import { PaperNode } from './types';
import { Factory } from './factory';
import { Directory } from '@lib/ast';
import { Application, Container, Graphics } from 'pixi.js';
import { CreateViewport, Mouse, ScreenType } from '../../shared/screen';

export class Paper {
  screen: ScreenType;
  container: {
    viewport: Container;
    background: Graphics;
    paper: Container; // scrollable
  };

  constructor(
    private engine: Application,
    private store: Store
  ) {
    const { width, height } = engine.canvas.getBoundingClientRect();
    const viewport = new Container({ label: 'map', parent: engine.stage, x: 0, y: 0 });
    const background = new Graphics({ label: 'bg', interactive: true, eventMode: 'dynamic', parent: viewport })
      .rect(0, 0, width, height)
      .fill('0x444');
    this.container = {
      viewport,
      background,
      paper: new Container({ label: 'paper', parent: viewport, zIndex: 2 }),
    };
    this.screen = CreateViewport(this.engine, this.container.paper, { zoom: { min: 0.03 } });
    this.reload();
    this.addEvents();
  }

  private reload(): void {
    const root = this.store.model.program.root;
    if (!root) {
      return;
    }
    this.render(root);

    // center in viewport
    const paper = this.container.paper;
    const dx = paper.width / 2;
    const dy = paper.height / 2;
    paper.children.forEach(c => {
      c.x += dx;
      c.y += dy;
    });
    console.log('map size: ', paper.getSize());
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

    paper.children.forEach(c => {
      c.on('pointerdowncapture', e => {
        mouse.mousedown(e as MouseEvent);
        isDragging = false;
        startX = e.clientX;
        startY = e.clientY;
        time = Date.now();
      });
      c.on('pointermove', e => {
        mouse.mousemove(e as MouseEvent);
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (dx * dx + dy * dy > DRAG_THRESHOLD * DRAG_THRESHOLD) {
          isDragging = true;
        }
      });
      c.on('pointerupcapture', e => {
        mouse.mouseup(e as MouseEvent);

        if (isDragging || Date.now() - time > 300) return;

        const n = (e.target as PaperNode).node;
        this.store.select(n.ast.type === 'declaration' ? n.parent! : n); // todo paper select data
        console.log(
          `depth: ${n.depth} x:${n.map.x} y: ${n.map.y}
          loc: ${n.ast.node['loc']} width: ${n.map.width} height: ${n.map.height}`,
          n.ast.node['exports'],
          n
        );
      });
      c.on('wheel', e => mouse.wheel(e as WheelEvent));
    });
  }

  private render(root: Directory) {
    const container = this.container.paper;
    container.removeChildren();
    const stack = [root];

    while (stack.length) {
      const n = stack.pop()!;
      stack.push(...n.children);
      const nodeGraphic = Factory.createNode(n, root.childrenDepth);

      let text = n.name;
      let prefix: string;

      if (n.ast.type === 'directory' && n !== root){
        const p = n.id.split('/').slice(-2);
        if (p.length === 2) {
          prefix = p[0];
          text = '/' + p[1];
        } else text = p[0];
      }

      n.map.labelPoints.forEach(p => {
        let prefixWidth = 0;
        const dirFontSize = Math.round(Math.sqrt(n.map.treeMapValue) * 0.4);
        if (prefix) {
          const prefixLabel = Factory.createLabel(
            p[0],
            p[1] + dirFontSize / 6,
            p[2],
            prefix,
            dirFontSize * 2 / 3,
            true
          );
          container.addChild(prefixLabel);
          prefixWidth = prefixLabel.width;
        }
        const label = Factory.createLabel(
          p[0] + prefixWidth,
          p[1],
          p[2],
          text,
          n.ast.type === 'directory' ? dirFontSize : 5,
          false
        );
        container.addChild(label);
      });

      container.addChild(nodeGraphic);
    }
  }
}
