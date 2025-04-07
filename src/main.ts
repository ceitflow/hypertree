import './styles.css';
import { Diagram } from './diagram.ts';
import { createTestUI } from './toolbar-test-ui';
import { loadPixelsFromImage } from './util/load-pixels-image';

(async function init() {
  const container = document.getElementById('viewport')!;
  const paper = document.getElementById('paper')!;
  const diagram = new Diagram(paper, container);
  createTestUI(container);
  await loadPixelsFromImage(diagram.graph, diagram.paper);
  diagram.screen.zoom.zoomAbsolute(0, 500, 200);
})();
