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
          id: 'five',
          name: 'Five.ts',
          depth: 3,
          loc: 300,
          exports: [
            AstFactory.createDeclaration({
              id: 'five/0',
              depth: 4,
              name: 'Five',
              loc: 300,
              token: { category: DeclarationEnum.Class }
            })
          ]
        }),
        AstFactory.createCodeFile({
          id: 'five',
          name: 'Five.ts',
          depth: 3,
          loc: 300,
          exports: [
            AstFactory.createDeclaration({
              id: 'five/0',
              depth: 4,
              name: 'Five',
              loc: 300,
              token: { category: DeclarationEnum.Class }
            })
          ]
        }),
      ],
      dirs: []
    }),
  ],
  files: [
    AstFactory.createCodeFile({
      id: 'five',
      name: 'Five.ts',
      depth: 3,
      loc: 300,
      exports: [
        AstFactory.createDeclaration({
          id: 'five/0',
          depth: 4,
          name: 'Five',
          loc: 300,
          token: { category: DeclarationEnum.Class }
        })
      ]
    }),
    AstFactory.createCodeFile({
      id: 'five',
      name: 'Five.ts',
      depth: 3,
      loc: 300,
      exports: [
        AstFactory.createDeclaration({
          id: 'five/0',
          depth: 4,
          name: 'Five',
          loc: 300,
          token: { category: DeclarationEnum.Class }
        })
      ]
    }),
  ],
});
