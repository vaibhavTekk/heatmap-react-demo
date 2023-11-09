import { fabric } from "fabric";
import { pdfjs } from "react-pdf";
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export const getPDFImageObject = async (tempFileURL: string, fabricCanvas: fabric.Canvas | null) => {
  // const file = e.target.files[0];
  // console.log(e);

  if (!fabricCanvas) {
    throw new Error("Canvas is null");
  }

  pdfjs.getDocument(tempFileURL).promise.then(async (doc) => {
    const page = await doc.getPage(1);
    // console.log(page);
    const viewport = page.getViewport({ scale: window.devicePixelRatio });
    // Prepare canvas using PDF page dimensions
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    // Render PDF page into canvas context
    const renderContext = {
      canvasContext: context as CanvasRenderingContext2D,
      viewport: viewport,
    };
    const renderTask = page.render({ ...renderContext });
    renderTask.promise.then(() => {
      const image = new fabric.Image(canvas, {
        // angle: 90,
        selectable: false,
      }).scaleToHeight(fabricCanvas.getHeight());
      image.name = "plan";
      fabricCanvas.add(image).centerObject(image).sendToBack(image);
    });
  });
};
