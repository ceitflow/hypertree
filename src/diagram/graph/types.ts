import { DirectoryMapItem } from '../../../astgen/src/files';

// Augment json type to simplify parsing
export type RawNode = Omit<DirectoryMapItem, 'children'> & {
  _modelRef?: NodeModel;
  children?: RawNode[];
};

export type RawData = {
  dirGraph: RawNode;
}

export type NodeModel = {
  // type: 'file' | 'directory';
  name: string;
  nestLevel: number;
  idPath: string;
  parent: NodeModel | null;
  children: NodeModel[]; // todo links create by { source: this, target: children[i] }
  layout: {
    x: number; // angle
    y: number; // radius
    layoutX: number;
    layoutY: number;
    depth: number;
    A: NodeModel | null; // default ancestor
    a: NodeModel; // ancestor
    z: number; // prelim
    m: number; // mod
    c: number; // change
    s: number; // shift
    t: NodeModel | null; // thread
    i: number; // number
  };
}

export type LinkModel = { // GroupLink and Link
  source: NodeModel,
  target: NodeModel,
}

export type GraphModel = {
  nodes: NodeModel[],
  links: LinkModel[],
  // mapByDepth;
  // linksMap
  // nodesMap
  // linksBetweenNodesMap  // A --(3 links)--> B
}
