import { Application, BitmapText, Container, Graphics } from 'pixi.js';
import { Viewport } from './viewport/viewport.ts';
import { BBox } from './viewport/scroller';
import { hierarchy, max } from 'd3';
import output from './data/output.json';
import tree, { NodeData } from './layout/tree.ts';
import { initDevtools } from '@pixi/devtools';
import { linkRadial } from './layout/link-interpolation.ts';

type DirectoryMapItem = {
  name: string,
  children?: DirectoryMapItem[];
  path?: string;
  nestLevel: number;
};

type Data = {
  dirGraph: DirectoryMapItem;
}

export function CanvasController(host: HTMLElement) {
  const app = new Application();
  initDevtools({ app });
  const { width, height } = host.getBoundingClientRect();
  let treeViewport: ReturnType<typeof Viewport>;
  let contentViewport: ReturnType<typeof Viewport>;

  const shape = ({ x, y, width, height }: BBox) => {
    return new Graphics({ x, y, width, height })
      .rect(0, 0, width, height)
      .fill('0xf0fff0');
  };

  return {
    init: async () => {
      await app.init({ background: 'white', resizeTo: host });
      host.prepend(app.canvas);

      treeViewport = Viewport(app, { bgColor: '666', bbox: { x: 0, y: 0, width: width / 3, height } });
      contentViewport = Viewport(app, { bgColor: '333', bbox: { x: width / 3, y: 0, width: width * 2 / 3, height } });

      for (let i = 0; i < 10; i++) {
        const trshape = shape({ x: 100, y: 100 + 100 * i, width: 80, height: 40 });
        treeViewport.container.addChild(trshape);
      }

      const data = (output as Data).dirGraph.children!.find(c => c.name === 'src')!.children!.find(c => c.name === 'app')!;
      const hData = hierarchy<DirectoryMapItem>(data);
      const maxDepth = max(hData, d => d.depth) || 1;
      const autoRadius = maxDepth * 1400; // pixels per row

      // Create a radial tree layout. The layout’s first dimension (x) is the angle, while the second (y) is the radius.
      const d3tree = tree()
        .size([2 * Math.PI, autoRadius])
        .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);

      // Sort the tree and apply the layout.
      const root = d3tree(hData);

      console.log(root.descendants(), root.links())
      const result = new Container();
      const linksContainer = new Container();
      const textContainer = new Container();
      const nodesContainer = new Container();
      result.addChild(linksContainer, nodesContainer, textContainer);

      root.links().forEach((link: { source: NodeData, target: NodeData }) => {
        const linkGraphic = new Graphics();
        linkRadial(linkGraphic, link.source, link.target );
        linksContainer.addChild(linkGraphic);
      });

      root.descendants().forEach((d: any) => {
        /* node */
        const circle = new Graphics().circle(0, 0, 6).fill(d.children ? '0x555' : '0xddd');
        circle.x = d.y * Math.cos(d.x - Math.PI / 2);
        circle.y = d.y * Math.sin(d.x - Math.PI / 2);
        nodesContainer.addChild(circle);

        /* label */
        const bitmapFontText = new BitmapText({
          text: d.data.name,
          style: {
            fontFamily: 'sans-serif',
            fontSize: 9,
          },
        });
        bitmapFontText.anchor = d.x < Math.PI === !d.children ? 0 : { x: 1, y: 0 }; // if d.x less than half circle and no children
        bitmapFontText.x = d.y * Math.cos(d.x - Math.PI / 2)
        bitmapFontText.y = d.y * Math.sin(d.x - Math.PI / 2) + (d.children?.length ? -6 : -6);
        bitmapFontText.angle = d.x * 180 / Math.PI - 90 + (d.x >= Math.PI ? 180 : 0);

        textContainer.addChild(bitmapFontText);
      });

      console.log(result.width, result.height)
      // result.x = result.width / 2;
      // result.y = result.height / 2;
      contentViewport.background.setSize(result.width, result.height);
      contentViewport.container.addChild(result as any);
    },
  };
}
