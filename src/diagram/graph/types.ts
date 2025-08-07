import { DirectoryMapItem, FileMapItem } from '../../../backend/src/files';

// Augment json type to simplify parsing
export type RawDir = Omit<DirectoryMapItem, 'dirs'> & {
  _modelRef?: DirModel;
  dirs?: RawDir[];
};

export type RawFile = FileMapItem;

export type RawData = {
  dirGraph: RawDir;
}

export type DirModel = {
  idPath: string;
  name: string;
  nestLevel: number;
  parent: DirModel | null;
  files: FileModel[];
  dirs: DirModel[]; // todo links create by { source: this, target: children[i] }
  layout: {
    x: number;
    y: number; // radius
    angle: number; // x
    angleAdjustment: number;
    radialX: number;
    radialY: number;
    depth: number;
    A: DirModel | null; // default ancestor
    a: DirModel; // ancestor
    z: number; // prelim
    m: number; // mod
    c: number; // change
    s: number; // shift
    t: DirModel | null; // thread
    i: number; // number
  };
}

export type FileModel = {
  idPath: string;
  name: string;
  nestLevel: number;
  layout: {
    // x: number;
    // y: number; // radius
    angle: number; // x
    angleAdjustment: number;
    radialX: number;
    radialY: number;
  }
}

export type LinkModel = { // GroupLink and Link
  source: DirModel,
  target: DirModel,
}

export type GraphModel = {
  nodes: DirModel[],
  links: LinkModel[],
  // mapByDepth;
  // linksMap
  // nodesMap
  // linksBetweenNodesMap  // A --(3 links)--> B
}
