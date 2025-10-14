import { DirectoryMapItem, FileMapItem, FileNode, ProgramGraph } from '../../../backend/src/files';

// Augment json type with '_modelRef' for easier parsing
export type RawProgramGraph = Omit<ProgramGraph, 'dirGraph'> & {
  dirGraph: RawDir;
};

export type RawDir = Omit<DirectoryMapItem, 'dirs'> & {
  _modelRef?: LayoutModel;
  dirs?: RawDir[];
};

export type RawFileNode = FileNode;
export type RawFile = FileMapItem;

export type LayoutModel = {
  idPath: string;
  name: string;
  type: 'dir' | 'file' | 'declaration' | 'virtual';
  nestLevel: number;
  parent: LayoutModel | null;
  children: LayoutModel[]; // todo links create by { source: this, target: children[i] }
  links: LinkModel[];
  postLayout: {
    leftNeighbour: null | LayoutModel;
    rightNeighbour: null | LayoutModel;
    depthsLeftRightNodes: [LayoutModel, LayoutModel][]; // this subtree left/right most children
    shrunkLeftXPos: number;
    totalWidth: number;
  };
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

    // tidy tree algorithm data
    Ancestor: LayoutModel | null; // default ancestor
    ancestor: LayoutModel; // ancestor
    prelim: number;
    mod: number;
    change: number;
    shift: number;
    thread: LayoutModel | null;
    i: number; // index of child in parent.children
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
