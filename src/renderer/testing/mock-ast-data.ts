import { AstFactory } from './ast-factory';
import { DeclarationEnum, NodeEnum } from '@lib/ast';

export const MockAstData = AstFactory.createDir({
  name: 'NebulaForge',
  type: NodeEnum.Directory,
  id: 'NebulaForge',
  depth: 0,
  dirs: [
    AstFactory.createDir({
      name: 'engine',
      id: 'NebulaForge/engine',
      depth: 1,
      files: [
        AstFactory.createCodeFile({
          id: 'NebulaForge/engine/OrbitPlanner.ts',
          name: 'OrbitPlanner.ts',
          depth: 3,
          loc: 300,
          definitions: [
            AstFactory.createDeclaration({
              id: 'NebulaForge/engine/OrbitPlanner.ts/OrbitPlanner',
              depth: 4,
              name: 'OrbitPlanner',
              loc: 300,
              token: { category: DeclarationEnum.Class }
            })
          ]
        }),
        AstFactory.createCodeFile({
          id: 'NebulaForge/engine/GravityWell.ts',
          name: 'GravityWell.ts',
          depth: 3,
          loc: 300,
          definitions: [
            AstFactory.createDeclaration({
              id: 'NebulaForge/engine/GravityWell.ts/GravityWell',
              depth: 4,
              name: 'GravityWell',
              loc: 300,
              token: { category: DeclarationEnum.Class }
            })
          ]
        }),
      ],
      dirs: []
    }),
    AstFactory.createDir({
      name: 'ui',
      id: 'NebulaForge/ui',
      depth: 1,
      files: [
        AstFactory.createCodeFile({
          id: 'NebulaForge/ui/GalaxyPanel.ts',
          name: 'GalaxyPanel.ts',
          depth: 3,
          loc: 300,
          definitions: [
            AstFactory.createDeclaration({
              id: 'NebulaForge/ui/GalaxyPanel.ts/GalaxyPanel',
              depth: 4,
              name: 'GalaxyPanel',
              loc: 300,
              token: { category: DeclarationEnum.Class }
            })
          ]
        }),
        AstFactory.createCodeFile({
          id: 'NebulaForge/ui/StarLegend.ts',
          name: 'StarLegend.ts',
          depth: 3,
          loc: 300,
          definitions: [
            AstFactory.createDeclaration({
              id: 'NebulaForge/ui/StarLegend.ts/StarLegend',
              depth: 4,
              name: 'StarLegend',
              loc: 300,
              token: { category: DeclarationEnum.Class }
            })
          ]
        }),
        AstFactory.createCodeFile({
          id: 'NebulaForge/ui/CometBadge.ts',
          name: 'CometBadge.ts',
          depth: 3,
          loc: 300,
          definitions: [
            AstFactory.createDeclaration({
              id: 'NebulaForge/ui/CometBadge.ts/CometBadge',
              depth: 4,
              name: 'CometBadge',
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
      id: 'NebulaForge/AppShell.ts',
      name: 'AppShell.ts',
      depth: 3,
      loc: 300,
      definitions: [
        AstFactory.createDeclaration({
          id: 'NebulaForge/AppShell.ts/AppShell',
          depth: 4,
          name: 'AppShell',
          loc: 300,
          token: { category: DeclarationEnum.Class }
        })
      ]
    }),
    AstFactory.createCodeFile({
      id: 'NebulaForge/LaunchConfig.ts',
      name: 'LaunchConfig.ts',
      depth: 3,
      loc: 300,
      definitions: [
        AstFactory.createDeclaration({
          id: 'NebulaForge/LaunchConfig.ts/LaunchConfig',
          depth: 4,
          name: 'LaunchConfig',
          loc: 300,
          token: { category: DeclarationEnum.Class }
        })
      ]
    }),
  ],
});
