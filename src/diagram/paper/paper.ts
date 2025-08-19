import { Graph } from '../graph/graph.ts';
import { createEngine } from './engine.ts';
import { CreateViewport, ScreenType } from '../screen';
import { linkRadial } from '../graph/layout/link-interpolation.ts';
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

  reloadPaper(): void {
    const result = new Container();
    const linksContainer = new Container();
    const textContainer = new Container();
    const nodesContainer = new Container();
    result.addChild(linksContainer, nodesContainer, textContainer);

    const { links, nodes } = this.graph.model;

    links.forEach(link => {
      const linkGraphic = new Graphics();
      linkRadial(linkGraphic, link);
      linksContainer.addChild(linkGraphic);
    });

    const createCircle = (x: number, y: number, name: string, isDir: boolean) => {
      const circle = new Graphics().circle(0, 0, 6).fill(isDir ? '0xcfcfcf' : '0xe24c00');
      circle.x = x;
      circle.y = y;
      circle.label = name;
      nodesContainer.addChild(circle);
    };

    const createLabel = (x: number, y: number, angle: number, name: string, isDir: boolean, altColor: boolean) => {
      const bitmapFontText = new BitmapText({
        text: `   ${name.substring(0, 5)}..     `,
        style: {
          fontFamily: 'sans-serif',
          fontSize: isDir ? 12 : 9,
          fill: altColor ? '#ffb976' : '#f5f5f5',
        },
      });
      bitmapFontText.anchor = angle < Math.PI === !isDir ? 0 : { x: 1, y: 0 }; // if d.angle less than half circle and no children
      bitmapFontText.x = x;
      bitmapFontText.y = y + (isDir ? -6 : -6);
      bitmapFontText.angle = (angle * 180) / Math.PI - 90 + (angle >= Math.PI ? 180 : 0);

      textContainer.addChild(bitmapFontText);
    }

    nodes.forEach((d, idx) => {
      createCircle(d.layout.radialX, d.layout.radialY, d.name, d.type === 'dir');
      createLabel(d.layout.radialX, d.layout.radialY, d.layout.angle, `${d.name}`, d.type === 'dir', idx % 2 === 0);
    });
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
