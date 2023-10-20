const points = [];
let max = 0;
const width = 840;
const height = 400;
let len = 20;

while (len--) {
  const val = Math.floor(Math.random() * 100);
  max = Math.max(max, val);
  const point = {
    x: Math.floor(Math.random() * width),
    y: Math.floor(Math.random() * height),
    value: val,
    radius: Math.floor(100 + Math.random() * 100),
  };
  points.push(point);
}
// heatmap data format
export const sampleData = {
  max: max,
  data: points,
};
