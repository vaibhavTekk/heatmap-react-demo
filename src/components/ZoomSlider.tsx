import { useEffect, useState } from "react";
import { zoomCanvas, zoomCanvasToValue } from "../utils/ZoomPanHandlers";
import { Slider, SliderTrack, SliderFilledTrack, SliderThumb, Icon } from "@chakra-ui/react";
import { TbZoomReset } from "react-icons/tb";

export default function ZoomSlider({ canvas }: { canvas: fabric.Canvas }) {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    zoomCanvasToValue(canvas, zoom);
  }, [zoom, canvas]);

  return (
    <div className="zoom-buttons">
      <Slider
        aria-label="slider-ex-4"
        step={parseFloat("0.1")}
        max={parseFloat("3.0")}
        min={parseFloat("0.2")}
        value={zoom}
        onChange={(e) => {
          setZoom(e);
        }}
      >
        <SliderTrack bg="teal.100">
          <SliderFilledTrack bg="teal" />
        </SliderTrack>
        <SliderThumb boxSize={6} />
      </Slider>
      <Icon
        as={TbZoomReset}
        boxSize={6}
        style={{ marginLeft: "10px" }}
        onClick={() => {
          zoomCanvas(canvas, "reset");
          setZoom(1);
        }}
      />
    </div>
  );
}
