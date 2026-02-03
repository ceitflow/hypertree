export type IdPath = string; // path relative to options.src OR package name if external

export enum NodeEnum {
  Code,
  Declaration,
  Other,
  Directory,
}

export type BaseNode<T extends NodeEnum> = {
  id: IdPath;
  type: T;
  name: string,
  depth: number;
}
