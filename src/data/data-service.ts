import { hierarchy } from 'd3';
import adminflow from './adminflow.json';
import { layout } from './layout/tree.ts';
import { DataType, DirectoryMapItem } from './types.ts';
import { BitmapText, Container, Graphics } from 'pixi.js';
import { linkRadial } from './layout/link-interpolation.ts';
import { LinkData, NodeData } from './layout/tree-util.ts';

export function DataService() {
  return {
    sample: () => {
      const data = (adminflow as DataType).dirGraph.children!.find(c => c.name === 'src')!.children!.find(c => c.name === 'app')!;
      const hData = hierarchy<DirectoryMapItem>(data);

      const { nodes, links } = layout(hData as any);
      console.log(nodes, links); // todo tree layout negative positions

      const result = new Container();
      const linksContainer = new Container();
      const textContainer = new Container();
      const nodesContainer = new Container();
      result.addChild(linksContainer, nodesContainer, textContainer);

      links.forEach((link: LinkData) => {
        const linkGraphic = new Graphics();
        linkRadial(linkGraphic, link.source, link.target);
        linksContainer.addChild(linkGraphic);
      });

      nodes.forEach((d: NodeData) => {
        /* node */
        const circle = new Graphics().circle(0, 0, 6).fill(d.children ? '0x555' : '0xddd');
        circle.x = d.layoutX;
        circle.y = d.layoutY;
        nodesContainer.addChild(circle);

        /* label */
        const bitmapFontText = new BitmapText({
          text: d.data.name,
          style: {
            fontFamily: 'sans-serif',
            fontSize: d.children ? 12 : 9,
            stroke: d.children ? 'white' : undefined,
          },
        });
        bitmapFontText.anchor = d.x! < Math.PI === !d.children ? 0 : { x: 1, y: 0 }; // if d.x less than half circle and no children
        bitmapFontText.x = d.layoutX;
        bitmapFontText.y = d.layoutY + (d.children?.length ? -6 : -6);
        bitmapFontText.angle = (d.x! * 180) / Math.PI - 90 + (d.x! >= Math.PI ? 180 : 0);

        textContainer.addChild(bitmapFontText);
      });
      const dx = result.width / 2;
      const dy = result.height / 2;
      result.children.forEach(c => {
        c.x += dx
        c.y += dy;
      })

      return result;
    },
  };
}