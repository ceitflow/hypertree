import { BBox, Screen } from './scroller';
import { Mouse, Touch } from './devices';
import { Application, Container, Graphics } from 'pixi.js';

export function Viewport(app: Application, opt: { bgColor: string, bbox: BBox }) {
  const { x, y, width, height } = opt.bbox;
  const containerBackground = new Graphics({ x: 0, y: 0, width, height })
    .rect(0, 0, width, height)
    .fill('0x' + opt.bgColor);
  const container = new Container({ // where nodes are added
    children: [containerBackground],
    mask: new Graphics().rect(x, y, width, height).fill('white'),
  });

  const viewportBackground = new Graphics({ x: 0, y: 0, width, height })
    .rect(0, 0, width, height)
    .fill('0x' + '111');
  const viewport = new Container({
    x,
    y,
    width,
    height,
    children: [viewportBackground, container],
    parent: app.stage,
    interactive: true,
    eventMode: 'static',
  });

  const scroller = Screen((x, y, scaleX, scaleY) => {
    container.x = x;
    container.y = y;
    container.scale.set(scaleX, scaleY);
  });

  scroller.viewportTransformer.updateViewport(opt.bbox);
  scroller.viewportTransformer.updateExtentArea({ x: 0, y: 0, width: width - x, height: height - y }); // size of graph
  scroller.controller.zoom.zoomToFit();

  app.ticker.add((delta) => {
    scroller.nextFrame(delta.lastTime);
  });

  const mouse = Mouse(scroller.controller);
  const touch = Touch(scroller.controller);

  viewport.on('mousedown', mouse.mousedown);
  viewport.on('mousemove', mouse.mousemove);
  viewport.on('mouseup', mouse.mouseup);
  viewport.on('wheel', mouse.wheel);
  // background.on('touchstart', touch.touchstart);
  // background.on('touchmove', touch.touchmove);
  // background.on('touchend', touch.touchend);

  return {
    viewport,
    background: containerBackground,
    container,
  };
}