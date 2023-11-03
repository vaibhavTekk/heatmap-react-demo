/* eslint-disable @typescript-eslint/no-explicit-any */
import { Stack, Text } from "@chakra-ui/react";
import { getAvg } from "../utils/tempHandler";

export default function PinDetails({
  currentPinId,
  items,
  dateRange,
}: {
  currentPinId: number;
  items: any[];
  dateRange: any[];
}) {
  const dataArray = items
    .filter((e) => e.id === currentPinId)[0]
    .data.filter((e: any) => {
      const date = new Date(e.ts);
      return date >= dateRange[0] && date <= dateRange[1];
    });
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  const avgTemp = getAvg(dataArray);
  return (
    <Stack spacing={1} style={{ width: "70%", marginTop: "12px" }}>
      <Text fontSize="2xl" as="b">
        Pin Details:
      </Text>
      <Text fontSize="md">Pin ID: {currentPinId}</Text>
      <Text fontSize="md">Pin Name: {items.filter((e) => e.id === currentPinId)[0].name}</Text>
      <Text fontSize="md">Temp: {avgTemp}</Text>
      <div style={{ overflowY: "scroll", height: "60px" }}>
        {dataArray.map((e: any, i: number) => {
          return (
            <Text key={i}>
              {new Date(e.ts).toDateString()} - {e.t}
            </Text>
          );
        })}
      </div>
    </Stack>
  );
}
