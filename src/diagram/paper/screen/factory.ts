import { Screen } from './screen.ts';
import { Application, Container } from 'pixi.js';

type ResizeCallback = (bbox: DOMRectReadOnly) => void;

export function CreateViewport(engine: Application, scrollableContainer: Container) {
  const screen = Screen((x: number, y: number, scaleX: number, scaleY: number) => {
    scrollableContainer.position.set(x, y);
    scrollableContainer.scale.set(scaleX, scaleY);
  });

  screen.transformer.updateVisibleViewport(engine.canvas.getBoundingClientRect());
  screen.transformer.updateExtentArea({ x: 0, y: 0, width: 1, height: 1 }); // size of graph

  engine.ticker.add(delta => screen.nextFrame(delta.lastTime));

  const resizeBrowserHandler = createResizeHandler(engine.canvas);
  resizeBrowserHandler.addCallback(({ width, height }: DOMRectReadOnly) => {
    engine.renderer.resize(width, height);
    screen.transformer.updateVisibleViewport({ x: 0, y: 0, width, height });
  });

  return screen;
}

function createResizeHandler(target: HTMLElement) {
  const callbacks: ResizeCallback[] = [];
  new ResizeObserver(entries => {
    callbacks.forEach(c => c(entries[0].contentRect));
  }).observe(target);

  return {
    addCallback: (c: ResizeCallback) => callbacks.push(c),
  };
}
