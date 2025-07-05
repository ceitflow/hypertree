import testJson from './test.json';
import { dia, shapes, g } from '@joint/core';
import { DirectoryMapItem, FileNode, IdPath, ProgramGraph } from './test-types.ts';

export const LoadShapes = (graph: dia.Graph) => {
  const cells: dia.Cell[] = [];
  let linksCount = 0;
  const program = testJson as any as ProgramGraph;

  let tempLayoutY = 0;

  const stack: DirectoryMapItem[] = program.dirGraph.children || [];
  while (stack.length) {
    const treeItem = stack.pop()!;
    const pos = { x: treeItem.nestLevel! * 200, y: tempLayoutY };
    if (treeItem.children?.length) {
      stack.push(...treeItem.children);
      const shape = createFolderShape(treeItem.name, pos);
      tempLayoutY += shape.size().height + 2;
    } else {
      // const file = program.files[treeItem.path!];
      // if (file.isExternalFile) continue;
      // const shape = createFileShape(file, pos, i => !program.files[i].isExternalFile);
      // tempLayoutY += shape.size().height + 100;
    }
  }

  function createFolderShape(name: string, position: g.PlainPoint) {
    const parentNode = new shapes.standard.Rectangle({
      position: { ...position },
      size: {
        width: 400,
        height: 50,
      },
      attrs: {
        body: {
          fill: 'antiquewhite',
          strokeWidth: 0,
        },
        label: {
          text: name,
        },
      },
    });
    cells.push(parentNode);
    return parentNode;
  }

  function createFileShape(file: FileNode, position: g.PlainPoint, renderLink: (target: IdPath) => boolean): dia.Element {
    const parentNode = new shapes.standard.Rectangle({
      id: file.id,
      position: { ...position },
      size: {
        width: 400,
        height: (file.exports.length || 1) * 25,
      },
      attrs: {
        body: {
          fill: file.isExternalFile ? 'mediumvioletred' : 'antiquewhite',
          strokeWidth: 0,
        },
        label: {
          text: file.id,
        },
      },
      ports: {
        groups: {
          in: {
            position: {
              name: 'right',
            },
            label: {
              markup: [
                {
                  tagName: 'text',
                  selector: 'label',
                },
              ],
            },
            attrs: {
              portBody: {
                magnet: true,
                width: 16,
                height: 16,
                x: -8,
                y: -8,
                fill: '#dea47c',
              },
            },
            markup: [
              {
                tagName: 'rect',
                selector: 'portBody',
              },
            ],
          },
          out: {
            position: {
              name: 'left',
            },
            label: {
              markup: [
                {
                  tagName: 'text',
                  selector: 'label',
                },
              ],
            },
            attrs: {
              portBody: {
                magnet: true,
                width: 16,
                height: 16,
                x: -8,
                y: -8,
                fill: '#277dff',
              },
            },
            markup: [
              {
                tagName: 'rect',
                selector: 'portBody',
              },
            ],
          },
        },
        // items: [{ id: 'out', group: 'out' }],
      },
    });

    cells.push(parentNode);

    // file.exports.forEach((token, idx) => {
    //   const port = {
    //     id: token.name,
    //     group: 'in',
    //     attrs: {
    //       label: {
    //         text: token.name,
    //       },
    //     },
    //   };
    //   parentNode.addPort(port);
    // });

    /*file.imports.forEach(importType => {
      if (!renderLink(importType.from)) return;
      cells.push(
        new shapes.standard.Link({
          source: { id: parentNode.id, port: 'out' },
          target: { id: importType.from, port: importType.token.name },
        })
      );
      linksCount++;
    });

    file.reexports.forEach(reexport => {
      if (!renderLink(reexport.from)) return;
      cells.push(
        new shapes.standard.Link({
          attrs: {
            line: {
              stroke: 'red',
            },
          },
          source: { id: parentNode.id, port: 'out' },
          target: { id: reexport.from },
        })
      );
      linksCount++;
    });*/

    return parentNode;
  }

  graph.resetCells(cells);

  console.log(`cells count: ${cells.length}, height: ${graph.getBBox()!.height}px, links: ${linksCount}`);
};
