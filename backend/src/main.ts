import { AstGraph } from './graph';
import { Analyzer } from './util';
import { writeFileSync } from 'node:fs';
import { createProgram, findConfigFile, parseJsonConfigFileContent, readConfigFile, sys } from 'typescript';

// Generate AST for JavaScript or TypeScript
(function main() {
  const args = {
    // /Users/ceitflow/WebstormProjects/koia-adminflow/adminflow
    // /Users/ceitflow/WebstormProjects/m3/coplan-visualizer
    // /Users/ceitflow/WebstormProjects/prototypes/graphkit-test-repos/angular/packages
    src: '/Users/ceitflow/WebstormProjects/koia-adminflow/adminflow',
    output: '/Users/ceitflow/WebstormProjects/prototypes/graphkit/backend/dist',
    // depth: 2,
    'exclude-file': ['eslint.config.js', 'vite.config.ts'],
  };
  try {
    const srcPath = args.src;
    const configPath = findConfigFile(srcPath, sys.fileExists);
    if (!configPath) return console.warn(`Unable to find source files and tsconfig in: ${srcPath}, stopping`);

    const configFile = readConfigFile(configPath, sys.readFile);
    const compilerOptions = parseJsonConfigFileContent(configFile.config, sys, srcPath);
    const fileNames = compilerOptions.fileNames;
    const program = createProgram(fileNames, compilerOptions.options); // todo this is 'host'

    const astGraph = new AstGraph(
      fileNames.map(f => program.getSourceFile(f)!),
      new Analyzer(srcPath, program)
    );
    const { stats } = astGraph.graph;

    console.log(`outputting json graph (${stats.filesCount} files + ${stats.externalFilesCount} external, total LOC: ${stats.totalLoc})`);
    console.log(program.getSymbolCount(), 'symbol count')
    writeFileSync(args.output + '/output.json', astGraph.toJSON());
  } catch (err) {
    console.error(err);
  }
})();
