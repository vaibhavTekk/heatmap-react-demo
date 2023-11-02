import { Slider, SliderFilledTrack, SliderThumb, SliderTrack, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { changeStrokeWidth } from "../utils/objectHandlers";

export default function StrokeWidthSlider({ canvas }: { canvas: fabric.Canvas | null }) {
  const [stroke, setStroke] = useState<number>(0);

  useEffect(() => {
    console.log("changed");
    changeStrokeWidth(stroke, canvas);
  }, [stroke]);

  return (
    <div className="stroke-width">
      <Text>Stroke Width</Text>
      <Slider
        aria-label="slider-ex-4"
        step={parseFloat("0.01")}
        max={parseFloat("5.0")}
        min={parseFloat("0")}
        value={stroke}
        onChange={(e) => {
          setStroke(e);
        }}
      >
        <SliderTrack bg="teal.100">
          <SliderFilledTrack bg="teal" />
        </SliderTrack>
        <SliderThumb boxSize={6} />
      </Slider>
    </div>
  );
}
