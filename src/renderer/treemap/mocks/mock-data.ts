import { Factory } from './factory';
import { DeclarationEnum, ProgramGraph } from '@lib/ast';

export const MockData: ProgramGraph = {
  name: 'mock',
  root: {
    name: 'Mockero',
    path: 'mockLand',
    depth: 0,
    dirs: [
      Factory.createDir({
        name: 'src',
        path: 'src',
        depth: 1,
        files: [
          Factory.createCodeFile({
            id: 'yyy/one',
            name: 'One.ts',
            depth: 2,
            loc: 100,
            exports: [
              Factory.createDeclaration({ id: 'yyy/one/0', name: 'One', depth: 3, loc: 100, token: { category: DeclarationEnum.Class } }),
            ],
          }),
          Factory.createCodeFile({
            id: 'yyy/two',
            name: 'Two.ts',
            depth: 2,
            loc: 110,
            exports: [
              Factory.createDeclaration({ id: 'yyy/two/0',name: 'Two', depth: 3,loc: 100, token: { category: DeclarationEnum.Class } }),
              Factory.createDeclaration({ id: 'yyy/two/1',name: 'One2', depth: 3,loc: 10, token: { category: DeclarationEnum.Class } }),
            ],
          }),
          Factory.createCodeFile({
            id: 'yyy/three',
            name: 'Three.ts',
            depth: 2,
            loc: 100,
            exports: [
              Factory.createDeclaration({ id: 'yyy/three/0',name: 'Three', depth: 3,loc: 100, token: { category: DeclarationEnum.Class } })
            ],
          }),
          Factory.createCodeFile({
            id: 'yyy/four',
            name: 'Four.ts',
            depth: 2,
            loc: 100,
            exports: [
              Factory.createDeclaration({ id: 'yyy/four/0',name: 'Four',depth: 3, loc: 100, token: { category: DeclarationEnum.Class } })
            ],
          }),
        ],
      })
    ],
    files: [
      Factory.createCodeFile({
        id: 'five',
        name: 'Five.ts',
        depth: 1,
        loc: 100,
        exports: [
          Factory.createDeclaration({ id: 'five/0', depth: 2, name: 'Five', loc: 100, token: { category: DeclarationEnum.Class } })
        ],
      }),
    ]
  },
  stats: {
    filesCount: 4,
    externalFilesCount: 0,
    totalLoc: 1,
  },
};
