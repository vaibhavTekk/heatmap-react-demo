import { fabric } from "fabric";
import imgUrl from "/signal-stream.png";

export const createPin = (x: number, y: number, temp: number, id: number, canvas: fabric.Canvas | null) => {
  if (!canvas) {
    throw new Error("Canvas not Active");
  }
  // const img = new Image(20, 20);
  // img.src = imgUrl;
  // img.style.objectFit = "contain";
  fabric.Image.fromURL(imgUrl, function (e) {
    e.set({ top: y - 20, left: x - 20, hasControls: false });
    e.scaleToHeight(40);
    e.scaleToWidth(40);
    e.name = "pin";
    e.temp = temp;
    e.id = id;
    canvas.add(e);
  });
  // const rect = new fabric.Image(img, {
  //   top: y - 20,
  //   left: x - 20,
  //   hasControls: false,
  // });
  // rect.scaleToHeight(40);
  // rect.scaleToWidth(40);
  // rect.name = "pin";
  // rect.temp = temp;
  // rect.id = id;
  // console.log(rect);
  // return rect;
};
