import { Stack, Text } from "@chakra-ui/react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function PinDetails({ currentPinId, items }: { currentPinId: number; items: any[] }) {
  return (
    <Stack spacing={1} style={{ width: "70%", marginTop: "12px" }}>
      <Text fontSize="2xl" as="b">
        Pin Details:
      </Text>
      <Text fontSize="md">Pin ID: {currentPinId}</Text>
      <Text fontSize="md">Pin Name: {items.filter((e) => e.id === currentPinId)[0].name}</Text>
      <Text fontSize="md">Temp: {items.filter((e) => e.id === currentPinId)[0].temp}</Text>
    </Stack>
  );
}
