import { GraphModel } from '../graph/types.ts';
import { Container, Graphics } from 'pixi.js';

export type Paper = {
  el: Container<Graphics | Container>;
  graph: GraphModel;
}

export type NodeView = {
  // generalized nodes[]...
}

// Views are dynamic and have additional features (lod, merging etc)
export type LinkView = {

}