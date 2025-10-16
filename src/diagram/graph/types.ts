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
  parent: LayoutModel | null;
  depthData: number; // original depth
  childrenData: LayoutModel[]; // original children data
  isRoot: boolean;
  isEjected: boolean;
  ejectRoot: LayoutModel | null;
  layoutChildren: LayoutModel[]; // actual children rendered in layout
  layoutDepth: number; // depth in actual layout
  layout: {
    x: number;
    y: number; // radius
    totalWidth: number;
    angle: number; // x
    radialX: number;
    radialY: number;
    angleAdjustment: number;

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
  resetLayoutData: () => void;
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
