import { fabric } from "fabric";

export const zoomCanvas = (canvas: fabric.Canvas, action: string) => {
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
        easing: fabric.util.ease["easeOutCubic"],
      });
      break;
    case "out":
      fabric.util.animate({
        startValue: canvas.getZoom(),
        endValue: zoom < 20 ? zoom / 1.25 : zoom,
        duration: 500,
        onChange: function (zoomvalue) {
          canvas.zoomToPoint(new fabric.Point(width / 2, height / 2), zoomvalue);
          canvas.renderAll();
        },
        onComplete: function () {
          canvas.renderAll();
        },
        easing: fabric.util.ease["easeOutCubic"],
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
        easing: fabric.util.ease.easeInOutCubic,
      });
      break;
  }
};

export const panCanvas = (canvas: fabric.Canvas, direction: string) => {
  const vpt = canvas.viewportTransform;
  const currentYValue = vpt[5];
  const currentXValue = vpt[4];
  switch (direction) {
    case "up":
      fabric.util.animate({
        startValue: currentYValue,
        endValue: currentYValue + 50,
        duration: 500,
        onChange: function (newValue) {
          vpt[5] = newValue;
          canvas.setViewportTransform(canvas.viewportTransform);
          canvas.renderAll();
        },
        onComplete: function () {
          canvas.renderAll();
        },
        easing: fabric.util.ease.easeOutCubic,
      });
      break;
    case "down":
      fabric.util.animate({
        startValue: currentYValue,
        endValue: currentYValue - 50,
        duration: 500,
        onChange: function (newValue) {
          vpt[5] = newValue;
          canvas.setViewportTransform(canvas.viewportTransform);
          canvas.renderAll();
        },
        onComplete: function () {
          canvas.renderAll();
        },
        easing: fabric.util.ease.easeOutCubic,
      });
      break;
    case "left":
      fabric.util.animate({
        startValue: currentXValue,
        endValue: currentXValue + 50,
        duration: 500,
        onChange: function (newValue) {
          vpt[4] = newValue;
          canvas.setViewportTransform(canvas.viewportTransform);
          canvas.renderAll();
        },
        onComplete: function () {
          canvas.renderAll();
        },
        easing: fabric.util.ease.easeOutCubic,
      });
      break;
    case "right":
      fabric.util.animate({
        startValue: currentXValue,
        endValue: currentXValue - 50,
        duration: 500,
        onChange: function (newValue) {
          vpt[4] = newValue;
          canvas.setViewportTransform(canvas.viewportTransform);
          canvas.renderAll();
        },
        onComplete: function () {
          canvas.renderAll();
        },
        easing: fabric.util.ease.easeOutCubic,
      });
      break;
  }
};
