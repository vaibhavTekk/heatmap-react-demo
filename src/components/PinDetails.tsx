/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
//@ts-nocheck

import { Stack, Text } from "@chakra-ui/react";
import { getAvg } from "../utils/tempHandler";
export default function PinDetails({
  currentPinId,
  items,
  data,
}: // dateRange,
{
  currentPinId: number;
  items: any[];
  data: any;
  // dateRange: any[];
}) {
  const currentSensor = items.filter((e) => e.id === currentPinId);
  let sensorName = "";
  if (currentSensor.length == 1) {
    sensorName = currentSensor[0].name;
  }

  const dataArray = data.data[sensorName];
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  const avgTemp = getAvg(dataArray);
  return (
    <>
      {currentSensor && dataArray ? (
        <Stack spacing={1} style={{ width: "70%", marginTop: "12px" }}>
          <Text fontSize="2xl" as="b">
            Pin Details:
          </Text>
          <Text fontSize="md">Pin ID: {currentPinId}</Text>
          <Text fontSize="md">Pin Name: {sensorName}</Text>
          <Text fontSize="md">Temp: {avgTemp}</Text>
          <div style={{ overflowY: "scroll", height: "60px" }}>
            {dataArray.map((e: any, i: number) => {
              return (
                <Text key={i}>
                  {new Date(e.sensor_epoch_ts * 1000).toDateString()} - {e.temp}
                </Text>
              );
            })}
          </div>
        </Stack>
      ) : (
        <p>Can't find Sensor</p>
      )}
    </>
  );
}
