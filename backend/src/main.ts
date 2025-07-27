import { AstGraph } from './graph';
import { Analyzer } from './util';
import { writeFileSync } from 'node:fs';
import { createProgram, findConfigFile, parseJsonConfigFileContent, readConfigFile, sys } from 'typescript';

// Generate AST for JavaScript or TypeScript
(function main() {
  const args = {
    src: 'C:\\Users\\Neoteric\\WebstormProjects\\mosaicX\\gyrus-backend\\ivap-nerve-engine',
    output: 'C:\\Users\\Neoteric\\WebstormProjects\\prototypes\\graphkit\\astgen\\dist',
    // depth: 2,
    "exclude-file": ['eslint.config.js', 'vite.config.ts'],
  }
  try {
    const srcPath = args.src;
    const configPath = findConfigFile(srcPath, sys.fileExists);
    if (!configPath)
      return console.warn(`Unable to find source files and tsconfig in: ${srcPath}, stopping`);

    const configFile = readConfigFile(configPath, sys.readFile);
    const compilerOptions = parseJsonConfigFileContent(configFile.config, sys, srcPath);
    const options = compilerOptions.options;
    const fileNames = compilerOptions.fileNames;
    const program = createProgram(fileNames, options);

    const astGraph = new AstGraph(
        fileNames.map(f => program.getSourceFile(f)!),
        new Analyzer(srcPath, program)
    );

    const f = Object.values(astGraph.graph.files);
    const ef = f.filter(f => f.isExternalFile);
    console.log(`outputting json graph (${f.length - ef.length} files + ${ef.length} external)`)
    writeFileSync(args.output + '/output.json', astGraph.toJSON());
  } catch (err) {
    console.error(err);
  }
})();

