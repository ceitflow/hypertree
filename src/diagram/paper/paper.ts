import { Graph } from '../graph/graph.ts';
import { createEngine } from './engine.ts';
import { LayoutModel } from '../graph/types.ts';
import { CreateViewport, ScreenType } from '../screen';
import { drawLinkGraphics } from '../graph/layout/draw-link.ts';
import { Application, BitmapText, Container, Graphics } from 'pixi.js';

export class Paper {
  engine: Application;
  graph: Graph;
  paper: Container;
  background: Graphics;
  scroller: ScreenType;

  private constructor(graph: Graph, engine: Application, paper: Container, background: Graphics, scroller: ScreenType) {
    this.graph = graph;
    this.engine = engine;
    this.paper = paper;
    this.background = background;
    this.scroller = scroller;
  }

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

  private createCircle = ({ layout: { radialX, radialY }, name, type }: LayoutModel) => {
    const circle = new Graphics().circle(0, 0, 6).fill(type === 'dir' ? '0xcfcfcf' : '0xe24c00');
    circle.x = radialX;
    circle.y = radialY;
    circle.label = name;
    return circle;
  };

  private createLabel = ({ layout: { radialX, radialY, angle }, name, type }: LayoutModel) => {
    const isDir = type === 'dir';
    const bitmapFontText = new BitmapText({
      text: `   ${name.substring(0, 15)}..     `,
      style: {
        fontFamily: 'sans-serif',
        fontSize: isDir ? 12 : 9,
        fill: '#ffb976', // altColor ? '#ffb976' : '#f5f5f5',
      },
    });
    bitmapFontText.anchor = angle < Math.PI === !isDir ? 0 : { x: 1, y: 0 }; // if d.angle less than half circle and no children
    bitmapFontText.x = radialX;
    bitmapFontText.y = radialY + (isDir ? -6 : -6);
    bitmapFontText.angle = (angle * 180) / Math.PI - 90 + (angle >= Math.PI ? 180 : 0);

    return bitmapFontText;
  };

  reloadPaper(): void {
    const { root } = this.graph.model;
    if (!root) return;

    const recursion = (root: LayoutModel): Container => {
      const container = new Container();
      const linksContainer = new Container();
      const textContainer = new Container();
      const nodesContainer = new Container();

      container.addChild(linksContainer, nodesContainer, textContainer);

      const stack = [root];
      while (stack.length) {
        const d = stack.pop()!;

        if (d.layout.isCircleRoot && d !== root) {
          const nested = recursion(d);
          nested.x += 1400;
          nested.y -= 2000;
          container.addChild(nested);
          continue;
        }

        d.links.forEach(link => {
          const linkGraphic = new Graphics();
          drawLinkGraphics(linkGraphic, link);
          linksContainer.addChild(linkGraphic);
        });

        nodesContainer.addChild(this.createCircle(d));
        textContainer.addChild(this.createLabel(d));

        stack.push(...d.children);
      }

      return container;
    };

    const result = recursion(root);

    const dx = result.width / 2;
    const dy = result.height / 2;
    result.children.forEach(c => {
      c.x += dx;
      c.y += dy;
    });

    console.log(result.width, result.height);
    this.scroller.transformer.updateExtentArea({ x: 0, y: 0, width: result.width, height: result.height });
    this.paper.addChild(result);
  }
}
