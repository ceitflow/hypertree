import { Application } from 'pixi.js';
import { initDevtools } from '@pixi/devtools';

export async function createEngine(host: HTMLElement) {
  const engine = new Application();
  await engine.init();
  await initDevtools({ app: engine });
  host.prepend(engine.canvas);
  return engine;
}