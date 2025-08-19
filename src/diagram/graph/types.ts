import { DirectoryMapItem, FileMapItem } from '../../../backend/src/files';

// Augment json type to simplify parsing
export type RawDir = Omit<DirectoryMapItem, 'dirs'> & {
  _modelRef?: LayoutModel;
  dirs?: RawDir[];
};

export type RawFile = FileMapItem;

export type RawData = {
  dirGraph: RawDir;
}

export type LayoutModel = {
  idPath: string;
  name: string;
  type: 'dir' | 'file';
  nestLevel: number;
  parent: LayoutModel | null;
  children: LayoutModel[]; // todo links create by { source: this, target: children[i] }
  layout: {
    x: number;
    y: number; // radius
    angle: number; // x
    radialX: number;
    radialY: number;
    depth: number;
    A: LayoutModel | null; // default ancestor
    a: LayoutModel; // ancestor
    z: number; // prelim
    m: number; // mod
    c: number; // change
    s: number; // shift
    t: LayoutModel | null; // thread
    i: number; // number
  };
}

export type LinkModel = { // GroupLink and Link
  source: LayoutModel,
  target: LayoutModel,
}

export type GraphModel = {
  nodes: LayoutModel[],
  links: LinkModel[],
  // mapByDepth;
  // linksMap
  // nodesMap
  // linksBetweenNodesMap  // A --(3 links)--> B
}
