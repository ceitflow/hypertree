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
  durationMs = 350;

  constructor(private transform: Transform) {
    this.startZoomLoop();
  }

  onZoom(zoomIn: boolean, x: number, y: number): void {
    // todo snapping (0.1, 0.2, ..., 1, 1.5.)
    this.requested = Math.max(
        this.min,
        Math.min(
            this.max,
            this.requested + (zoomIn ? 0.1 : -0.1), // todo adaptive step based on zoom
        ),
    );
    this.startMousePos[0] = x;
    this.startMousePos[1] = y;
    this.restart = true;
  }

  // todo addictive transform (adds x, y and zoom to current transform)
  // todo squish animation (apple like)

  startZoomLoop(): void {
    const { transform: { transform, update } } = this;

    const loop = (currentTime: number) => {
      if (this.loop.active) this.loop.id = requestAnimationFrame(loop);

      if (this.restart) {
        this.restart = false;
        this.start[0] = transform[0];
        this.start[1] = transform[1];
        this.start[2] = transform[2];
        this.start[3] = currentTime;
        // calculate end result here (after this.durationMs)
      }

      if (transform[2] === this.requested) {
        return;
      }

      const ratio = (currentTime - this.start[3]) / this.durationMs;
      if (ratio >= 1) {
        transform[2] = this.requested;
        transform[0] = this.start[0] - this.startMousePos[0] * (this.requested - this.start[2]);
        transform[1] = this.start[1] - this.startMousePos[1] * (this.requested - this.start[2]);
        this.transform.update();
        return;
      }

      transform[0] = this.start[0] - this.startMousePos[0] * (this.requested - this.start[2]) * ratio;
      transform[1] = this.start[1] - this.startMousePos[1] * (this.requested - this.start[2]) * ratio;
      transform[2] = this.start[2] + (this.requested - this.start[2]) * ratio;
      this.transform.update();
    }
    this.loop.active = true;
    this.loop.id = requestAnimationFrame(loop);
  }
}
