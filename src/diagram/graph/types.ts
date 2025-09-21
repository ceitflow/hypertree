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
  links: LinkModel[];
  layout: {
    x: number;
    y: number; // radius
    depth: number;
    angle: number; // x
    radialX: number;
    radialY: number;

    isCircleRoot: boolean;
    radialXOffset: number;
    radialYOffset: number;
    isVirtual: boolean;

    A: LayoutModel | null; // default ancestor
    a: LayoutModel; // ancestor
    z: number; // prelim
    m: number; // mod
    c: number; // change
    s: number; // shift
    t: LayoutModel | null; // thread
    i: number; // number
  };

  clearLayoutDataRecursively: (parent: LayoutModel | null, i: number) => void;
}

export type LinkModel = { // GroupLink and Link
  source: LayoutModel,
  target: LayoutModel,
}

export type GraphModel = {
  root: null | LayoutModel;
  // mapByDepth;
  // linksMap
  // nodesMap
  // linksBetweenNodesMap  // A --(3 links)--> B
}
