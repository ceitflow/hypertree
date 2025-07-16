export type DirectoryMapItem = {
  name: string,
  children?: DirectoryMapItem[];
  path?: string;
  nestLevel: number;
};

export type DataType = {
  dirGraph: DirectoryMapItem;
}
