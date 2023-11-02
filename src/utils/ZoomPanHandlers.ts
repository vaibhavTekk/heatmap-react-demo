import { fabric } from "fabric";

export const zoomCanvasToValue = (canvas: fabric.Canvas | null, zoomValue: number) => {
  if (!canvas || !canvas.width || !canvas.height) {
    // throw new Error("Canvas is null");
    return;
  }

  const width: number = canvas.width;
  const height: number = canvas.height;
  canvas.zoomToPoint(new fabric.Point(width / 2, height / 2), zoomValue);
  canvas.renderAll();
};

export const zoomCanvas = (canvas: fabric.Canvas | null, action: string) => {
  if (!canvas) {
    // throw new Error("Canvas is null");
    return;
  }

  const zoom = canvas.getZoom();
  const width: number = canvas.width as number;
  const height: number = canvas.height as number;
  switch (action) {
    case "in":
      fabric.util.animate({
        startValue: canvas.getZoom(),
        endValue: zoom < 20 ? zoom * 1.25 : zoom,
        duration: 500,
        onChange: function (zoomvalue) {
          canvas.zoomToPoint(new fabric.Point(width / 2, height / 2), zoomvalue);
          canvas.renderAll();
        },
        onComplete: function () {
          canvas.renderAll();
        },
        easing: fabric.util.ease.easeOutSine,
      });
      break;
    case "out":
      fabric.util.animate({
        startValue: canvas.getZoom(),
        endValue: zoom > 0.25 ? zoom / 1.25 : zoom,
        duration: 500,
        onChange: function (zoomvalue) {
          canvas.zoomToPoint(new fabric.Point(width / 2, height / 2), zoomvalue);
          canvas.renderAll();
        },
        onComplete: function () {
          canvas.renderAll();
        },
        easing: fabric.util.ease.easeOutSine,
      });
      break;
    case "reset":
      fabric.util.animate({
        startValue: canvas.getZoom(),
        endValue: 1,
        duration: 500,
        onChange: function (zoomvalue) {
          canvas.zoomToPoint(new fabric.Point(width / 2, height / 2), zoomvalue);
          canvas.renderAll();
        },
        onComplete: function () {
          canvas.renderAll();
        },
        easing: fabric.util.ease.easeInOutSine,
      });
      break;
  }
};

export const panCanvas = (canvas: fabric.Canvas | null, direction: string) => {
  if (!canvas || !canvas.viewportTransform) {
    // throw new Error("Canvas is null");
    return;
  }

  const vpt = [...canvas.viewportTransform];
  // console.log(vpt);
  const currentYValue = vpt[5];
  const currentXValue = vpt[4];
  switch (direction) {
    case "up":
      fabric.util.animate({
        startValue: currentYValue,
        endValue: Math.floor(currentYValue + 50),
        duration: 500,
        onChange: function (newValue) {
          vpt[5] = newValue;
          canvas.setViewportTransform(vpt);
          canvas.renderAll();
        },
        onComplete: function () {
          canvas.renderAll();
        },
        easing: fabric.util.ease.easeOutSine,
      });
      break;
    case "down":
      fabric.util.animate({
        startValue: currentYValue,
        endValue: Math.floor(currentYValue - 50),
        duration: 500,
        onChange: function (newValue) {
          vpt[5] = newValue;
          canvas.setViewportTransform(vpt);
          canvas.renderAll();
        },
        onComplete: function () {
          canvas.renderAll();
        },
        easing: fabric.util.ease.easeOutSine,
      });
      break;
    case "left":
      fabric.util.animate({
        startValue: currentXValue,
        endValue: Math.floor(currentXValue + 50),
        duration: 500,
        onChange: function (newValue) {
          vpt[4] = newValue;
          canvas.setViewportTransform(vpt);
          canvas.renderAll();
        },
        onComplete: function () {
          canvas.renderAll();
        },
        easing: fabric.util.ease.easeOutSine,
      });
      break;
    case "right":
      fabric.util.animate({
        startValue: currentXValue,
        endValue: Math.floor(currentXValue - 50),
        duration: 500,
        onChange: function (newValue) {
          vpt[4] = newValue;
          canvas.setViewportTransform(vpt);
          canvas.renderAll();
        },
        onComplete: function () {
          canvas.renderAll();
        },
        easing: fabric.util.ease.easeOutSine,
      });
      break;
    case "reset":
      fabric.util.animate({
        startValue: currentXValue,
        endValue: 0,
        duration: 500,
        onChange: function (newValue) {
          vpt[4] = newValue;
          canvas.setViewportTransform(vpt);
          canvas.renderAll();
        },
        onComplete: function () {
          canvas.renderAll();
        },
        easing: fabric.util.ease.easeOutSine,
      });
      fabric.util.animate({
        startValue: currentYValue,
        endValue: 0,
        duration: 500,
        onChange: function (newValue) {
          vpt[5] = newValue;
          canvas.setViewportTransform(vpt);
          canvas.renderAll();
        },
        onComplete: function () {
          canvas.renderAll();
        },
        easing: fabric.util.ease.easeOutSine,
      });
      break;
  }
};
