import { AstFactory } from './ast-factory';
import { DeclarationEnum, NodeEnum } from '@lib/ast';

export const MockAstData = AstFactory.createDir({
  name: 'Mockero',
  type: NodeEnum.Directory,
  id: 'mockLand',
  depth: 0,
  dirs: [
    AstFactory.createDir({
      name: 'src',
      id: 'src',
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
          id: 'yyy/two',
          name: 'Two.ts',
          depth: 2,
          loc: 110,
          exports: [
            AstFactory.createDeclaration({
              id: 'yyy/two/0',
              name: 'Two',
              depth: 3,
              loc: 100,
              token: { category: DeclarationEnum.Class }
            }),
            AstFactory.createDeclaration({
              id: 'yyy/two/1',
              name: 'One2',
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
      loc: 100,
      exports: [
        AstFactory.createDeclaration({
          id: 'five/0',
          depth: 2,
          name: 'Five',
          loc: 100,
          token: { category: DeclarationEnum.Class }
        })
      ]
    })
  ]
});
