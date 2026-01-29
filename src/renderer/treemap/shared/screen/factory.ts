import { Screen } from './screen';
import { Application, Container } from 'pixi.js';
import { DeepPartial, ScreenConfig } from './types';

export function CreateViewport(engine: Application, scrollable: Container, config: DeepPartial<ScreenConfig> = {}) {
  const screen = Screen((x: number, y: number, scaleX: number, scaleY: number) => {
    scrollable.position.set(x, y);
    scrollable.scale.set(scaleX, scaleY);
  }, config);

  screen.transformer.updateVisibleViewport(engine.canvas.getBoundingClientRect());
  screen.transformer.updateExtentArea({ x: 0, y: 0, width: scrollable.width, height: scrollable.height }); // size of graph

  engine.ticker.add(delta => screen.nextFrame(delta.lastTime));

  return screen;
}
