import type { TransformType } from './types.ts';

export class Transform {
  readonly transform: TransformType = [0, 0, 1]; // paper transform

  constructor(private styles: CSSStyleDeclaration) {}

  translate(x: number, y: number, scale: number): void {
    this.transform[0] = x;
    this.transform[1] = y;
    this.transform[2] = scale;
    this.update();
  }

  translateBy(x: number, y: number) {
    this.transform[0] += x;
    this.transform[1] += y;
    this.update();
  }

  update(): void {
    this.styles.transform = `translate(${this.transform[0]}px,${this.transform[1]}px) scale(${this.transform[2]})`;
  }
}
