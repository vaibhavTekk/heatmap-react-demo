/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck

import { Slider, SliderFilledTrack, SliderThumb, SliderTrack, Text } from "@chakra-ui/react";

export default function StrokeWidthSlider({
  radius,
  setRadius,
}: {
  radius: number;
  setRadius: SetStateAction<number>;
}) {
  return (
    <div className="stroke-width">
      <Text>Radius:</Text>
      <Slider
        aria-label="slider-ex-4"
        step={parseInt("1")}
        max={parseInt("600")}
        min={parseInt("0")}
        value={radius}
        onChange={(e) => {
          setRadius(e);
        }}
      >
        <SliderTrack bg="teal.100">
          <SliderFilledTrack bg="teal" />
        </SliderTrack>
        <SliderThumb boxSize={4} />
      </Slider>
    </div>
  );
}
