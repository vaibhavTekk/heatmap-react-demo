import { Icon } from "@chakra-ui/react";
import { HiArrowDown, HiArrowLeft, HiArrowRight, HiArrowUp, HiOutlineRefresh } from "react-icons/hi";
import { panCanvas } from "../utils/ZoomPanHandlers";

export default function PanButtons({ canvas }: { canvas: fabric.Canvas | null }) {
  return (
    <div className="pan-buttons">
      <Icon
        as={HiArrowLeft}
        style={{ gridColumn: "1", gridRow: "2", cursor: "pointer" }}
        boxSize={6}
        onClick={() => panCanvas(canvas, "left")}
      />
      <Icon
        as={HiArrowUp}
        style={{ gridColumn: "2", gridRow: "1", cursor: "pointer" }}
        boxSize={6}
        onClick={() => panCanvas(canvas, "up")}
      />
      <Icon
        as={HiOutlineRefresh}
        style={{ gridColumn: "2", gridRow: "2", cursor: "pointer" }}
        boxSize={6}
        onClick={() => panCanvas(canvas, "reset")}
      />
      <Icon
        as={HiArrowDown}
        style={{ gridColumn: "2", gridRow: "3", cursor: "pointer" }}
        boxSize={6}
        onClick={() => panCanvas(canvas, "down")}
      />
      <Icon
        as={HiArrowRight}
        style={{ gridColumn: "3", gridRow: "2", cursor: "pointer" }}
        boxSize={6}
        onClick={() => panCanvas(canvas, "right")}
      />
    </div>
  );
}
