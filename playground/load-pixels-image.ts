import { dia, shapes } from "@joint/core";

export const loadPixelsFromImage = (graph: dia.Graph, paper: dia.Paper) => {
  return new Promise<void>(resolve => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    const size = 5;
    const limit = 1000;
    img.src = '/neo.png'; // Path to the image in the public folder
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the image onto the canvas
      ctx.drawImage(img, 0, 0);

      // Get the pixel data from the canvas
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const pixels = imageData.data;

      let nodes: dia.Element[] = [];
      // Iterate over the Uint8ClampedArray in a 2D manner
      for (let y = 0; y < img.height; y++) {
        if (nodes.length >= limit) break;

        for (let x = 0; x < img.width; x++) {
          const index = (y * img.width + x) * 4;
          const r = pixels[index];     // Red component
          const g = pixels[index + 1]; // Green component
          const b = pixels[index + 2]; // Blue component
          // const a = pixels[index + 3]; // Alpha component

          if (r || g || b) {
            nodes.push(new shapes.standard.Rectangle({
              size: { width: size, height: size },
              position: { x: x * size, y: y * size },
              attrs: {
                body: {
                  fill: `rgb(${r}, ${g}, ${b})`,
                  strokeWidth: 0,
                }
              }
            }));
          }
        }
      }
      graph.addCells(nodes);
      paper.setDimensions(canvas.width * size, canvas.height * size);
      resolve();
    }
  })
}

export const renderSVGToCanvas = (svg: SVGElement, canvas: HTMLCanvasElement) => {
  // Create a Blob from the SVG string
  const serializer = new XMLSerializer();
  const string = serializer.serializeToString(svg);
  const blob = new Blob([string], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const svgBase64 = btoa(string);
  const dataURL = `data:image/svg+xml;base64,${svgBase64}`;

  // Create an image from the SVG
  const img = new Image();
  img.onload = function () {
    // Once the image loads, draw it to the canvas
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);

    // Clean up
    URL.revokeObjectURL(url);
  };

  img.onerror = function(e) {
    console.error("Error loading image:", e);
    console.log("URL was:", url);
    URL.revokeObjectURL(url);
  };

  img.src = dataURL;
}