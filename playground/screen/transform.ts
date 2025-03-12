import type { TransformType } from './types.ts';

export class Transform {
  // viewport: Viewport;
  transform: TransformType = [0, 0, 1]; // paper transform

  constructor(private styles: CSSStyleDeclaration) {
  }

  update(): void {
    this.styles.transform = `translate(${this.transform[0]}px,${this.transform[1]}px) scale(${this.transform[2]})`;
  }
}