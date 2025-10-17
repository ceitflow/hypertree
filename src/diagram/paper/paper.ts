import { Graph } from '../graph/graph.ts';
import { createEngine } from './engine.ts';
import { LayoutModel } from '../graph/types.ts';
import { drawLinkGraphics } from './draw-link.ts';
import { CreateViewport, ScreenType } from './screen';
import { GraphFactory } from '../graph/graph-factory.ts';
import { Application, BitmapText, Container, Graphics } from 'pixi.js';

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
        const node = stack.pop()!;

        const structuralLinks = node.layoutChildren.map(c => GraphFactory.createLinkModel(node, c));

        structuralLinks.forEach(link => {
          const linkGraphic = new Graphics();
          drawLinkGraphics(linkGraphic, link);
          linksContainer.addChild(linkGraphic);
        });

        nodesContainer.addChild(this.createCircle(node));
        textContainer.addChild(this.createLabel(node));

        stack.push(...node.layoutChildren);

        if (node.ejectRoot && (node.idPath.startsWith(''))) {
          const nestedContainer = recursion(node.ejectRoot);
          const length = Math.hypot(node.layout.radialX, node.layout.radialY); // same as sqrt(x*x + y*y)
          const newLength = length * 3;
          nestedContainer.x = (node.layout.radialX / length) * newLength;
          nestedContainer.y = (node.layout.radialY / length) * newLength;
          container.addChild(nestedContainer);
        }
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

    this.scroller.transformer.updateExtentArea({ x: 0, y: 0, width: result.width, height: result.height });
    this.paper.addChild(result);
  }

  private createCircle = (model: LayoutModel) => {
    const {
      layout: { radialX, radialY },
      name,
      type,
      isRoot,
    } = model;
    let color: string;
    switch (type) {
      case 'dir':
        color = '0xcfcfcf';
        break;
      case 'file':
        color = '0xe24c00';
        break;
      case 'declaration':
        color = '0x277DFF';
        break;
      // virtual is for debugging only
      case 'virtual':
        color = '0x00FF00';
        break;
    }
    if (model.isEjected) color = '0x00FF00';
    const circle = new Graphics().circle(0, 0, isRoot ? 30 : 6).fill(color);
    circle.x = radialX;
    circle.y = radialY;
    circle.label = name;
    circle.interactive = true;
    circle.on('pointerdown', e => console.log(`w: ${model.layout.totalWidth}`, model));
    return circle;
  };

  private createLabel = ({ layout: { radialX, radialY, angle }, name, type }: LayoutModel) => {
    const isDir = type === 'dir';
    const bitmapFontText = new BitmapText({
      text: `   ${name.substring(0)}     `,
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
}
