import { AstFactory } from './ast-factory';
import { DeclarationEnum, NodeEnum } from '@lib/ast';

export const MockAstData = AstFactory.createDir({
  name: 'Mockero',
  type: NodeEnum.Directory,
  id: 'Mockero',
  depth: 0,
  dirs: [
    AstFactory.createDir({
      name: 'src',
      id: 'Mockero/src',
      depth: 1,
      files: [
        AstFactory.createCodeFile({
          id: 'yyy/one',
          name: 'One.ts',
          depth: 2,
          loc: 100,
          exports: [
            AstFactory.createDeclaration({
              id: 'yyy/one/0',
              name: 'One',
              depth: 3,
              loc: 100,
              token: { category: DeclarationEnum.Class }
            })
          ]
        }),
        AstFactory.createCodeFile({
          id: 'yyy/one11',
          name: 'One1.ts',
          depth: 2,
          loc: 100,
          exports: [
            AstFactory.createDeclaration({
              id: 'yyy/one11/0',
              name: 'One1',
              depth: 3,
              loc: 100,
              token: { category: DeclarationEnum.Class }
            })
          ]
        }),
        AstFactory.createCodeFile({
          id: 'yyy/one12',
          name: 'One2.ts',
          depth: 2,
          loc: 100,
          exports: [
            AstFactory.createDeclaration({
              id: 'yyy/one12/0',
              name: 'One2',
              depth: 3,
              loc: 100,
              token: { category: DeclarationEnum.Class }
            })
          ]
        }),
        AstFactory.createCodeFile({
          id: 'yyy/one13',
          name: 'One3.ts',
          depth: 2,
          loc: 100,
          exports: [
            AstFactory.createDeclaration({
              id: 'yyy/one13/0',
              name: 'One3',
              depth: 3,
              loc: 100,
              token: { category: DeclarationEnum.Class }
            })
          ]
        }),
        AstFactory.createCodeFile({
          id: 'yyy/two',
          name: 'Two.ts',
          depth: 2,
          loc: 1000,
          exports: [
            AstFactory.createDeclaration({
              id: 'yyy/two/0',
              name: 'Long',
              depth: 3,
              loc: 990,
              token: { category: DeclarationEnum.Class }
            }),
            AstFactory.createDeclaration({
              id: 'yyy/two/1',
              name: 'Short',
              depth: 3,
              loc: 10,
              token: { category: DeclarationEnum.Class }
            })
          ]
        }),
        AstFactory.createCodeFile({
          id: 'yyy/longer',
          name: 'Longer.ts',
          depth: 2,
          loc: 2000,
          exports: [
            AstFactory.createDeclaration({
              id: 'yyy/longer/0',
              name: 'Long',
              depth: 3,
              loc: 1990,
              token: { category: DeclarationEnum.Class }
            }),
            AstFactory.createDeclaration({
              id: 'yyy/longer/1',
              name: 'Short',
              depth: 3,
              loc: 10,
              token: { category: DeclarationEnum.Class }
            })
          ]
        }),
        AstFactory.createCodeFile({
          id: 'yyy/three',
          name: 'Three.ts',
          depth: 2,
          loc: 100,
          exports: [
            AstFactory.createDeclaration({
              id: 'yyy/three/0',
              name: 'Three',
              depth: 3,
              loc: 100,
              token: { category: DeclarationEnum.Class }
            })
          ]
        }),
        AstFactory.createCodeFile({
          id: 'yyy/four',
          name: 'Four.ts',
          depth: 2,
          loc: 100,
          exports: [
            AstFactory.createDeclaration({
              id: 'yyy/four/0',
              name: 'Four',
              depth: 3,
              loc: 100,
              token: { category: DeclarationEnum.Class }
            })
          ]
        })
      ]
    })
  ],
  files: [
    AstFactory.createCodeFile({
      id: 'five',
      name: 'Five.ts',
      depth: 1,
      loc: 70,
      exports: [
        AstFactory.createDeclaration({
          id: 'five/0',
          depth: 2,
          name: 'Five',
          loc: 70,
          token: { category: DeclarationEnum.Class }
        })
      ]
    }),
    AstFactory.createCodeFile({
      id: 'six',
      name: 'six.ts',
      depth: 1,
      loc: 90,
      exports: [
        AstFactory.createDeclaration({
          id: 'six/0',
          depth: 2,
          name: 'Six',
          loc: 90,
          token: { category: DeclarationEnum.Class }
        })
      ]
    }),
    AstFactory.createOtherFile({
      id: 'other',
      name: 'other.ts',
      depth: 1,
      loc: 100,
    }),
    AstFactory.createCodeFile({
      id: 'seven',
      name: 'seven.ts',
      depth: 1,
      loc: 100,
      exports: [
        AstFactory.createDeclaration({
          id: 'seven/0',
          depth: 2,
          name: 'Seven',
          loc: 100,
          token: { category: DeclarationEnum.Class }
        })
      ]
    }),
  ]
});
