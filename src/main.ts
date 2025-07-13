import "./style.css";
import { CanvasController } from './canvas-controller.ts';

const container = document.getElementById('viewport')!;
const canvas = CanvasController(container);
await canvas.init();
