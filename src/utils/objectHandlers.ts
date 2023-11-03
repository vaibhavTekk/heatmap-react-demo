/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
//@ts-nocheck
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
        name: "tempLabel",
      });
      const pin = new fabric.Group([op, label, tempLabel], { hasControls: false });
      pin.setOptions({ name: "pin", label: name, temp: isNaN(temp) ? 0 : temp, id: id, radius: radius });

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

export const updateTemp = (canvas: fabric.Canvas | null, newTemp: number, id: number) => {
  if (!canvas) {
    return;
  }

  const pins = canvas.getObjects().filter((e) => e.name === "pin" && e.id == id);
  if (pins.length > 0) {
    const pin = pins[0];
    const label = pin._objects.filter((e: any) => e.name === "tempLabel")[0];
    label.set("text", (isNaN(newTemp) ? 0 : newTemp).toString() + "\xB0C");
    pin.set("temp", isNaN(newTemp) ? 0 : newTemp);
    canvas.renderAll();
    // canvas.remove(pin);
  }
};

export const changeStrokeWidth = (stroke: number, canvas: fabric.Canvas | null) => {
  if (!canvas) {
    return;
  }
  const plans = canvas.getObjects().filter((e) => e.name === "plan");
  if (plans.length > 0) {
    const plan = plans[0];
    const items = plan._objects;
    items.forEach((e: any) => {
      // console.log(e);
      e.strokeWidth = stroke;
    });
    canvas.remove(plan);
    const obj = new fabric.Group(items);
    // console.log(obj);
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
    canvas.add(obj).centerObject(obj).requestRenderAll();
  } else {
    console.log("no plans");
  }
};
