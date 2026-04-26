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
          id: 'Mockero/src/Five-1.ts',
          name: 'Five.ts',
          depth: 3,
          loc: 300,
          definitions: [
            AstFactory.createDeclaration({
              id: 'Mockero/src/Five-1.ts/Five',
              depth: 4,
              name: 'Five',
              loc: 300,
              token: { category: DeclarationEnum.Class }
            })
          ]
        }),
        AstFactory.createCodeFile({
          id: 'Mockero/src/Five-2.ts',
          name: 'Five.ts',
          depth: 3,
          loc: 300,
          definitions: [
            AstFactory.createDeclaration({
              id: 'Mockero/src/Five-2.ts/Five',
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
    AstFactory.createDir({
      name: 'src',
      id: 'Mockero/src-copy',
      depth: 1,
      files: [
        AstFactory.createCodeFile({
          id: 'Mockero/src-copy/Five-1.ts',
          name: 'Five.ts',
          depth: 3,
          loc: 300,
          definitions: [
            AstFactory.createDeclaration({
              id: 'Mockero/src-copy/Five-1.ts/Five',
              depth: 4,
              name: 'Five',
              loc: 300,
              token: { category: DeclarationEnum.Class }
            })
          ]
        }),
        AstFactory.createCodeFile({
          id: 'Mockero/src-copy/Five-2.ts',
          name: 'Five.ts',
          depth: 3,
          loc: 300,
          definitions: [
            AstFactory.createDeclaration({
              id: 'Mockero/src-copy/Five-2.ts/Five',
              depth: 4,
              name: 'Five',
              loc: 300,
              token: { category: DeclarationEnum.Class }
            })
          ]
        }),
        AstFactory.createCodeFile({
          id: 'Mockero/src-copy/Five-3.ts',
          name: 'Five.ts',
          depth: 3,
          loc: 300,
          definitions: [
            AstFactory.createDeclaration({
              id: 'Mockero/src-copy/Five-3.ts/Five',
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
      id: 'Mockero/Five-root-1.ts',
      name: 'Five.ts',
      depth: 3,
      loc: 300,
      definitions: [
        AstFactory.createDeclaration({
          id: 'Mockero/Five-root-1.ts/Five',
          depth: 4,
          name: 'Five',
          loc: 300,
          token: { category: DeclarationEnum.Class }
        })
      ]
    }),
    AstFactory.createCodeFile({
      id: 'Mockero/Five-root-2.ts',
      name: 'Five.ts',
      depth: 3,
      loc: 300,
      definitions: [
        AstFactory.createDeclaration({
          id: 'Mockero/Five-root-2.ts/Five',
          depth: 4,
          name: 'Five',
          loc: 300,
          token: { category: DeclarationEnum.Class }
        })
      ]
    }),
  ],
});
