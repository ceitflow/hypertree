import './styles.css';
import { Diagram } from './diagram.ts';
import { loadPixelsFromImage } from './util/load-pixels-image';
import { shapes } from '@joint/core';

(async function init() {
  const container = document.getElementById('viewport')!;
  const paper = document.getElementById('paper')!;
  const diagram = new Diagram(paper, container);
  await loadPixelsFromImage(diagram.graph, diagram.paper);

  new shapes.standard.Rectangle({
    position: { x: 100, y: 100 },
    size: { width: 140, height: 68 },
    attrs: {
      body: {
        fill: 'orange',
        strokeWidth: 1,
        stroke: 'gold',
      },
    },
  }).addTo(diagram.graph);

  // const canvas = document.createElement('canvas');
  // const { width, height } = diagram.paper.getComputedSize();
  // canvas.width = width;
  // canvas.height = height;
  // canvas.className = 'canvas';
  //
  // paper.appendChild(canvas);
})();
