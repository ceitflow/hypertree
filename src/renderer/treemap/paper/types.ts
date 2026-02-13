import { Graphics } from 'pixi.js';
import { GraphNode, VisibilityEdge } from '../graph';

// todo 5 paper nodes each for graph node type (so can add different behavior to different nodes views)
export type PaperNode = Graphics & { node: GraphNode };

export type PaperEdgeSegment = Graphics & { edge: VisibilityEdge }; // segments between each visibility nodes
