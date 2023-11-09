/* eslint-disable @typescript-eslint/no-explicit-any */
export const getAvg = (dataArray: any[]) => {
  let sum = 0;
  dataArray.forEach((e: any) => {
    sum += parseFloat(e.temp);
  });
  const avgTemp = parseFloat((sum / dataArray.length).toFixed(2));
  return avgTemp;
};
