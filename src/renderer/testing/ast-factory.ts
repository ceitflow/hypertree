import { CodeFile, DeclarationEnum, DeclarationModifier, DeclarationNode, Directory, NodeEnum, OtherFile } from '@lib/ast';

export class AstFactory {
  static createCodeFile({
    id = 'id',
    name = 'name',
    depth = 0,
    loc = 1,
    kind = 'TS',
    isExternalFile,
    imports = [],
    definitions = []
  }: Partial<CodeFile>): CodeFile {
    const result: CodeFile = {
      type: NodeEnum.Code,
      isExternalFile: false,
      id,
      name,
      depth,
      loc,
      kind,
      imports,
      definitions
    };
    if (isExternalFile) {
      result.isExternalFile = true;
    }
    return result;
  }

  static createOtherFile({ id = 'id', name = 'name', loc = 1, bigFile = false }: Partial<OtherFile>): OtherFile {
    return {
      type: NodeEnum.Other,
      id,
      depth: 0,
      name,
      loc,
      bigFile
    };
  }

  static createDir({ name = 'name', id = 'path', depth = 0, dirs = [], files = [] }: Partial<Directory>): Directory {
    return {
      name,
      id,
      type: NodeEnum.Directory,
      depth,
      dirs,
      files
    };
  }

  static createDeclaration({
    id = 'id',
    name = 'name',
    depth = 1,
    loc = 1,
    modifier = DeclarationModifier.None,
    token = { category: DeclarationEnum.Unknown, type: 'unknown' }
  }: Partial<DeclarationNode>): DeclarationNode {
    return {
      id,
      type: NodeEnum.Declaration,
      name,
      depth,
      loc,
      modifier,
      token
    };
  }
}
