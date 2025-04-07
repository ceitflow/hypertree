import { dia } from '@joint/core';
import { TransformType } from '../screen/types.ts';

export function paperPatch(paper: dia.Paper, t: TransformType) {
  const ua = navigator.userAgent;
  if ((/AppleWebKit/.test(ua) && !/Chrome/.test(ua)) || /\b(iPad|iPhone|iPod)\b/.test(ua)) {
    paper.cells.getScreenCTM = () => {
      const matrix = paper.svg.getScreenCTM();
      if (!matrix) return matrix;
      matrix.a = t[2]; // scaleX
      matrix.d = t[2]; // scaleY
      return matrix;
    };
  }
}
