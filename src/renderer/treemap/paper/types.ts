import { Graphics } from 'pixi.js';
import { GraphNode } from '../../graph';

export type PaperNode = Graphics & { node: GraphNode };
