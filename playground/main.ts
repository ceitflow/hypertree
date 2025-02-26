import './styles.css';
import { dia, g, V } from '@joint/core';
import { loadFromImage } from "./load-image";

(async function init() {
  const graph = new dia.Graph();
  const paper = new dia.Paper({
    el: document.getElementById('paper'),
    model: graph,
    autoFreeze: true,
    background: { color: 'whitesmoke' },
    width: 2500,
    height: 1700,
    async: true,
    defaultRouter: {
      name: 'manhattan',
    }
  });

  await loadFromImage(graph, paper);
  // *************
  const dbbox = document.getElementById('diagramContainer')!.getBoundingClientRect(); // todo onResize store todo new api observers
  const viewport = new g.Rect(0, 0, dbbox.width, dbbox.height); // todo Viewport Class, add scale etc
  const Padding = 0;

  let panStart: g.Point | null = null;
  let currScale = paper.scale().sx;
  let paperSizeOriginal = paper.getComputedSize();
  let paperSize = paperSizeOriginal;

  const setTranslation = (dx: number, dy: number) => {
    // axes are inverted so left-positive, right-negative, top-positive, bottom-negative
    viewport.x = Math.max(Math.min(dx, Padding), Math.min(viewport.width - paperSize.width - Padding, 0));
    viewport.y = Math.max(Math.min(dy, Padding), Math.min(viewport.height - paperSize.height - Padding, 0));
    paper.translate(viewport.x, viewport.y);
  }
  paper.on('blank:pointerdown', (e) => {
    const evt = e.originalEvent as MouseEvent;
    if (!evt.ctrlKey) {
      panStart = new g.Point(evt.x - viewport.x, evt.y - viewport.y);
      currScale = paper.scale().sx;
    }
  });

  paper.el.addEventListener('mousemove', (evt) => {
    if (panStart) {
      setTranslation(evt.x - panStart.x, evt.y - panStart.y);
    }
  });
  paper.el.addEventListener('mouseup', () => {
    panStart = null;
  });
  paper.on({
    'paper:pinch': (evt, ox, oy, scale) => {
      if (evt.ctrlKey) {
        evt.preventDefault();
        currScale = Math.min(Math.max(paper.scale().sx + (scale >= 1 ? 0.1 : -0.1), 0.2), 2);
        paper.scaleUniformAtPoint(currScale, new g.Point(ox, oy)); // todo own performant version of scale? keep stored matrix
        paperSize = V.transformRect(new g.Rect(0, 0, paperSizeOriginal.width, paperSizeOriginal.height), paper.matrix());
        paper.setDimensions(paperSize.width, paperSize.height);
        const currT = paper.translate();
        setTranslation(currT.tx, currT.ty);
      }
    }
  });

  console.log(paper);
  paper.model = new dia.Graph();
  // let visibleArea = scroller.getVisibleArea();
  // scroller.on('scroll', debounce(() => {
})();