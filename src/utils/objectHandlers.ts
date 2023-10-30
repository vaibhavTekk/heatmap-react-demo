import { fabric } from "fabric";
import iconUrl from "../assets/icon.png";

export const createPin = (
  x: number,
  y: number,
  temp: number,
  id: number,
  name: string,
  radius: number,
  canvas: fabric.Canvas | null
) => {
  if (!canvas) {
    throw new Error("Canvas not Active");
  }
  // const img = new Image(20, 20);
  // img.src = imgUrl;
  // img.style.objectFit = "contain";

  // const rect = new fabric.Rect({ top: y - 20, left: x - 20, hasControls: false, width: 20, height: 20 });
  // rect.name = "pin";
  // rect.temp = temp;
  // rect.id = id;
  // canvas.add(rect);

  fabric.Image.fromURL(
    iconUrl,
    (op) => {
      op.set({ top: y - 20, left: x - 20 });
      // op.type = "sensor"

      op.scaleToHeight(30);
      op.scaleToWidth(30);
      const label = new fabric.Text(name, {
        top: y + 10,
        left: x - 25,
        fontFamily: "Poppins",
        fontSize: 18,
      });
      const tempLabel = new fabric.Text(temp + "\xB0C", {
        top: y + 30,
        left: x - 25,
        fontFamily: "Poppins",
        fontSize: 18,
      });
      const pin = new fabric.Group([op, label, tempLabel], { hasControls: false });
      pin.name = "pin";
      pin.label = name;
      pin.temp = temp;
      pin.id = id;
      pin.radius = radius;
      canvas.add(pin);
    },
    { crossOrigin: "anonymous" }
  );

  // fabric.Image.fromURL(imgUrl, function (e) {
  //   e.set({ top: y - 20, left: x - 20, hasControls: false });
  //   e.scaleToHeight(40);
  //   e.scaleToWidth(40);
  //   e.name = "pin";
  //   e.temp = temp;
  //   e.id = id;
  //   canvas.add(e);
  // });
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

// export const createPin = (x: number, y: number, temp: number, id: number, canvas: fabric.Canvas | null) => {
//   if (!canvas) {
//     throw new Error("Canvas not Active");
//   }
//   // const img = new Image(20, 20);
//   // img.src = imgUrl;
//   // img.style.objectFit = "contain";

//   const rect = new fabric.Rect({ top: y - 20, left: x - 20, hasControls: false, width: 20, height: 20 });
//   rect.name = "pin";
//   rect.temp = temp;
//   rect.id = id;
//   canvas.add(rect);

//   // fabric.Image.fromURL(imgUrl, function (e) {
//   //   e.set({ top: y - 20, left: x - 20, hasControls: false });
//   //   e.scaleToHeight(40);
//   //   e.scaleToWidth(40);
//   //   e.name = "pin";
//   //   e.temp = temp;
//   //   e.id = id;
//   //   canvas.add(e);
//   // });
//   // const rect = new fabric.Image(img, {
//   //   top: y - 20,
//   //   left: x - 20,
//   //   hasControls: false,
//   // });
//   // rect.scaleToHeight(40);
//   // rect.scaleToWidth(40);
//   // rect.name = "pin";
//   // rect.temp = temp;
//   // rect.id = id;
//   // console.log(rect);
//   // return rect;
// };
