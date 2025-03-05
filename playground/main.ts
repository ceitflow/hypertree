import './styles.css';
import { Diagram } from "./diagram.ts";
import { loadPixelsFromImage } from "./load-pixels-image";
import { quadtree } from 'd3';

(async function init() {
  const container = document.getElementById('viewport')!;
  const paper = document.getElementById('paper')!;
  const diagram = new Diagram(paper, container);
  await loadPixelsFromImage(diagram.graph, diagram.paper);

  // const canvas = document.createElement('canvas');
  // const { width, height } = diagram.paper.getComputedSize();
  // canvas.width = width;
  // canvas.height = height;
  // canvas.className = 'canvas';
  //
  // paper.appendChild(canvas);
})();