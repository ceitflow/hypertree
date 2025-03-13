import { Transform } from '../transform.ts';
import { Point } from '../types.ts';

export class Zoom {
  loop = { id: 0, active: false };
  start = [0, 0, 1, 0]; // [x, y, zoom, timeMs]
  startMousePos: Point = [0, 0]; // todo centroid
  restart = true;
  requested = 1;
  min = 0.1;
  max = 4;
  durationMs = 150;

  constructor(private transform: Transform) {
    this.startZoomLoop();
  }

  onZoom(zoomIn: boolean, x: number, y: number): void {
    const s = this.transform.transform[2];
    const base = s < 1 ? s * s : s * 0.2;
    this.requested = Math.max(
      this.min,
      Math.min(this.max, this.requested + base * (zoomIn ? 1 : -1))
    );
    console.log(this.requested);
    this.startMousePos[0] = x;
    this.startMousePos[1] = y;
    this.restart = true;
  }

  // todo squish animation (apple like)

  startZoomLoop(): void {
    const current = this.transform.transform;

    const loop = (currentTime: number) => {
      if (this.loop.active) this.loop.id = requestAnimationFrame(loop);

      if (this.restart) {
        this.restart = false;
        this.start[0] = current[0];
        this.start[1] = current[1];
        this.start[2] = current[2];
        this.start[3] = currentTime;
        // calculate end result here (after this.durationMs)
      }

      if (current[2] === this.requested) {
        return;
      }

      const ratio = (currentTime - this.start[3]) / this.durationMs;
      if (ratio >= 1) {
        this.transform.translate(
          this.start[0] - this.startMousePos[0] * (this.requested - this.start[2]),
          this.start[1] - this.startMousePos[1] * (this.requested - this.start[2]),
          this.requested
        );
        return;
      }

      this.transform.translate(
        this.start[0] - this.startMousePos[0] * (this.requested - this.start[2]) * ratio,
        this.start[1] - this.startMousePos[1] * (this.requested - this.start[2]) * ratio,
        this.start[2] + (this.requested - this.start[2]) * ratio
      );
    };
    this.loop.active = true;
    this.loop.id = requestAnimationFrame(loop);
  }
}
