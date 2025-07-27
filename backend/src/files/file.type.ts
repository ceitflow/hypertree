import { SourceFile } from 'typescript';
import { DeclarationNode } from './declaration.type';

export type ExternalSourceFile = {
  file: SourceFile;
  packageName: string;
}

export type IdPath = string; // path relative to options.src OR package name if external

export type DirectoryMapItem = {
  name: string,
  dirs?: DirectoryMapItem[];
  files?: FileMapItem[];
  path: IdPath;
  nestLevel: number;
};

export type FileMapItem = {
  name: string,
  path: IdPath;
  nestLevel: number;
}

export type ProgramGraph = {
  name: string;
  // referencedExternalPackages: string[]
  files: { [id: IdPath]: FileNode };
  dirGraph: DirectoryMapItem; // for layout
}

export type FileNode = {
  id: IdPath;
  isExternalFile?: true; // node_modules
  loc: number;
  extension: string; // ts js etc.
  defaultExport?: DeclarationNode;
  exports: DeclarationNode[];
  emptyImports: FileEmptyImport[];
  imports: FileImportToken[]; // add importGroups (for knowing what was in each import together)
  reexports: FileReExportToken[];
}
export type FileEmptyImport = {
  // import from './styles.css'
  type: 'empty';
  from: IdPath;
  isExternal?: true;
}

export type FileImportToken = {
  // import { A as B } from ''
  // import default from ''
  from: IdPath;
  token: {
    isDefault?: true,
    name: string,
    originalName?: string,
    pathToDeclaration: IdPath
  }
  isExternal?: true;
}

export type FileReExportToken = {
  from: IdPath;
  token: {
    isDefault?: true;
    name: string; // (export * ...) is split to this individual reexports, so it always has a name
    originalName?: string; // if alias // todo rename to identifier
    pathToDeclaration: IdPath;
  }
}
