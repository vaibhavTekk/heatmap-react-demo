// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
import { Helper } from "dxf";
import { fabric } from "fabric";

const readFileContent = (file: File) => {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = (event) => resolve(event.target?.result);
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

export const addDxfToCanvas = async (file: File, canvas: fabric.Canvas | null) => {
  if (!fabric.Canvas) {
    throw new Error("Canvas is Null");
  }

  readFileContent(file).then((e) => {
    const helper = new Helper(e);
    const svg = helper.toSVG();
    fabric.loadSVGFromString(svg, (objects, options) => {
      // if (stroke) {
      objects.forEach((object) => {
        object.strokeWidth = 1;
        // object.fill = "rgb(255,0,0,0.1)";
      });
      // }
      if (!canvas) {
        return;
      }
      const obj = fabric.util.groupSVGElements(objects, options);
      obj.name = "plan";
      obj.selectable = false;
      obj
        .scaleToHeight(canvas.getHeight() * (3 / 4))
        .set({
          left: canvas.getWidth() / 2,
          top: canvas.getHeight() / 2,
        })
        .setCoords();
      obj.opacity = 0.7;
      canvas.add(obj).centerObject(obj).renderAll();
      // obj.setCoords();
      // obj.sendToBack();
      // obj.perPixelTargetFind = true;
    });
  });
};

// const svg = sampleSvg;
// console.log(svg);
