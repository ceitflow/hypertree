import { dia } from '@joint/core';
import { TransformType } from './types.ts';

export function paperPatch(paper: dia.Paper, t: TransformType) {
  // patch for webkit (safari), getScreenCTM returns invalid matrix with scale fixed to 1
  // which prevents pinch zooming on mobile
  const agent = navigator.userAgent;
  if ((/AppleWebKit/.test(agent) && !/Chrome/.test(agent)) || /\b(iPad|iPhone|iPod)\b/.test(agent)) {
    paper.cells.getScreenCTM = () => {
      const matrix = paper.svg.getScreenCTM();
      if (!matrix) return matrix;
      matrix.a = t[2]; // scaleX
      matrix.d = t[2]; // scaleY
      return matrix;
    };
  }
}
