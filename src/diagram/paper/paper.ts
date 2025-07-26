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
    this.graph = graph
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

    nodes.forEach(d => {
      const isDir = true;
      /* node */
      const circle = new Graphics().circle(0, 0, 6).fill(isDir ? '0xfff' : '0xe24c00');
      circle.x = d.layout.layoutX;
      circle.y = d.layout.layoutY;
      nodesContainer.addChild(circle);

      /* label */
      const bitmapFontText = new BitmapText({
        text: d.name,
        style: {
          fontFamily: 'sans-serif',
          fontSize: isDir ? 12 : 9,
          stroke: isDir ? 'white' : undefined,
        },
      });
      bitmapFontText.anchor = d.layout.x! < Math.PI === !isDir ? 0 : { x: 1, y: 0 }; // if d.x less than half circle and no children
      bitmapFontText.x = d.layout.layoutX;
      bitmapFontText.y = d.layout.layoutY + (isDir ? -6 : -6);
      bitmapFontText.angle = (d.layout.x! * 180) / Math.PI - 90 + (d.layout.x! >= Math.PI ? 180 : 0);

      textContainer.addChild(bitmapFontText);
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
