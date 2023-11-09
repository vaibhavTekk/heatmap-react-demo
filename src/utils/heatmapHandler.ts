/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck

export const calculateHeatMap = (canvas: fabric.Canvas | null, heatmap: any, radius: number) => {
  if (!canvas || !heatmap) {
    return;
  }
  // generate data points for heatmap according to objects in fabric
  let max = -100;
  const points = canvas
    .getObjects()
    .filter((e) => e.name === "pin" && e.temp !== 0)
    .map((e) => {
      max = Math.max(e.temp, max);
      return { x: e.left + 20, y: e.top + 20, value: e.temp * e.opacity, radius: radius };
    });
  heatmap.setData({ max, data: points });
  canvas.renderAll();
};
