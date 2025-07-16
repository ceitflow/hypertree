import { Screen } from './screen';
import { Mouse } from './devices';
import { initDevtools } from '@pixi/devtools';
import { Application, Container, Graphics } from 'pixi.js';
import { ContainerShape, ContainerShapeType } from './shapes/container-shape.ts';

type ResizeCallback = (bbox: DOMRectReadOnly) => void;

function Graph() {
  // const bbox;

  return {};
}

export async function Diagram(host: HTMLElement) {
  const { engine, bg } = await createEngine(host);
  // const graph = Graph();
  const paper = ContainerShape(engine.stage);
  const viewport = createViewport(engine, paper); // todo Observe scale change (there will be LOD controller)

  const mouse = Mouse(viewport.screen.controller);
  bg.on('mousedown', mouse.mousedown);
  bg.on('mousemove', mouse.mousemove);
  bg.on('mouseup', mouse.mouseup);
  bg.on('wheel', mouse.wheel);
  paper.container.on('mousedown', mouse.mousedown);
  paper.container.on('mousemove', mouse.mousemove);
  paper.container.on('mouseup', mouse.mouseup);
  paper.container.on('wheel', mouse.wheel);

  return {
    paper,
    load: (container: Container) => {
      console.log(container.width, container.height);
      paper.resize(container.getSize());
      paper.addChild(container as any);
      viewport.screen.transformer.updateExtentArea({ x: 0, y: 0, width: container.width, height: container.height });
      viewport.screen.controller.zoom.zoomToFit();
    },
  };
}

async function createEngine(host: HTMLElement) {
  const engine = new Application();
  await engine.init();
  await initDevtools({ app: engine });
  host.prepend(engine.canvas);
  const { width, height } = host.getBoundingClientRect();
  const bg = new Graphics({ interactive: true, eventMode: 'static', parent: engine.stage })
    .rect(0, 0, width, height)
    .fill('0x222');

  return {
    engine,
    bg
  };
}

function createViewport(engine: Application, paper: ContainerShapeType) {
  const resizeHandler = createResizeHandler(engine.canvas);
  resizeHandler.addCallback(({ width, height }: DOMRectReadOnly) => {
    engine.renderer.resize(width, height);
    screen.transformer.updateVisibleViewport({ x: 0, y: 0, width, height });
  });

  const screen = Screen((x: number, y: number, scaleX: number, scaleY: number) => {
    paper.position(x, y);
    paper.scale(scaleX, scaleY);
  });

  screen.transformer.updateVisibleViewport(engine.canvas.getBoundingClientRect());
  screen.transformer.updateExtentArea({ x: 0, y: 0, width: 1, height: 1 }); // size of graph

  engine.ticker.add(delta => screen.nextFrame(delta.lastTime));

  return {
    screen,
  };
}

function createResizeHandler(target: HTMLElement) {
  const callbacks: ResizeCallback[] = [];
  new ResizeObserver(entries => {
    console.log(entries[0].contentRect)
    callbacks.forEach(c => c(entries[0].contentRect));
  }).observe(target);

  return {
    addCallback: (c: ResizeCallback) => callbacks.push(c),
  };
}
