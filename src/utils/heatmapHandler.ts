/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck

export const calculateHeatMap = (canvas: fabric.Canvas | null, heatmap: any, radius: number) => {
  if (!canvas || !heatmap) {
    return;
  }
  // generate data points for heatmap according to objects in fabric
  // console.log("heatmap changed");
  // let max = -100;
  // console.log(canvas.getObjects());
  const canvasObjects = canvas.getObjects().filter((e) => e.name === "pin" && e.temp !== 0);
  if (canvasObjects.length > 0) {
    const points = canvasObjects.map((e) => {
      // max = Math.max(e.temp, max);
      return { x: e.left + 20, y: e.top + 20, value: e.temp * e.opacity, radius: radius };
    });
    heatmap.setData({ max: 100, data: points });
    heatmap.repaint();
  }
  canvas.renderAll();
};
