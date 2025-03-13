import type { Point } from '../types.ts';
import { Transform } from '../transform.ts';

export class Pointer {
  loop = { id: 0, active: false };
  current = [0, 0] as Point;
  cached = [] as Point[];
  cacheSize = 5;

  constructor(private transform: Transform) {}

  down(x: number, y: number) {
    const { loop, current, cached, cacheSize } = this;
    loop.active = true;
    current[0] = x;
    current[1] = y;
    cached.splice(0, cached.length, [x, y]);

    // update cached pointer per frame (so the move deltas are bigger)
    const looper = (t: number) => {
      if (loop.active) loop.id = requestAnimationFrame(looper);

      const prevPosition = cached[cached.length - 1];

      cached.push([current[0], current[1]]);
      if (cached.length > cacheSize) {
        cached.shift();
      }

      this.transform.translateBy(current[0] - prevPosition[0], current[1] - prevPosition[1]);
    };
    loop.id = requestAnimationFrame(looper);
  }

  move(evt: MouseEvent): void {
    this.current[0] = evt.clientX;
    this.current[1] = evt.clientY;
  }

  up(): void {
    this.interrupt();
  }

  interrupt(): void {
    this.loop.active = false;
  }
}
