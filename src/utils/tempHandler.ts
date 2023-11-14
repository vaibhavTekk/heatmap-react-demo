/* eslint-disable @typescript-eslint/no-explicit-any */
export const getAvg = (dataArray: any[]) => {
  if (!dataArray) {
    return 0;
  }
  let sum = 0;
  dataArray.forEach((e: any) => {
    sum += parseFloat(e.temp);
  });
  const avgTemp = parseFloat((sum / dataArray.length).toFixed(2));
  return avgTemp;
};
