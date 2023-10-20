import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import h337, { HeatmapConfiguration } from "heatmap.js";
import { sampleData } from "../utils/sampleHeatmap";
import { HiArrowUp, HiArrowDown, HiArrowLeft, HiArrowRight } from "react-icons/hi";

import "./canvas.css";
import { panCanvas, zoomCanvas } from "../utils/ZoomPanHandlers";

export default function Canvas() {
  const canvasRef = useRef(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  const heightRef = useRef(0);
  const widthRef = useRef(0);

  const initFabric = (width: number, height: number) => {
    fabricRef.current = new fabric.Canvas(canvasRef.current);
    fabricRef.current.setWidth(width);
    fabricRef.current.setHeight(height);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const heatmapRef = useRef<any>(null);
  const heatmapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const initHeatmap = () => {
    const container: HTMLElement = document.getElementsByClassName("heatmap")[0] as HTMLElement;
    const config: HeatmapConfiguration = {
      container,
    };
    heatmapRef.current = h337.create(config);
    heatmapCanvasRef.current = heatmapRef.current._renderer.canvas;
    // heatmapCanvasRef.current =
    if (heatmapCanvasRef.current) {
      fabricRef.current?.add(new fabric.Image(heatmapCanvasRef.current, { selectable: false, name: "heatmap" }));
    }

    heatmapRef.current.setData(sampleData);
    // console.log(heatmapRef);
    // console.log(fabricRef.current);
    // console.log("heatmapref", heatmapRef);
  };

  const disposeFabric = () => {
    fabricRef.current?.dispose();
  };

  useEffect(() => {
    heightRef.current = document.getElementsByClassName("main-canvas-container")[0].clientHeight;
    widthRef.current = document.getElementsByClassName("main-canvas-container")[0].clientWidth;
    const heatmapElement = document.getElementsByClassName("heatmap")[0] as HTMLElement;
    heatmapElement.style.height = heightRef.current + "px";
    heatmapElement.style.width = widthRef.current + "px";

    initFabric(widthRef.current, heightRef.current);
    initHeatmap();
    return () => {
      disposeFabric();
    };
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = useState<any[]>([
    { id: 1, name: "Sensor1" },
    { id: 2, name: "Sensor2" },
    { id: 3, name: "Sensor3" },
    { id: 4, name: "Sensor4" },
  ]);
  const itemsRef = useRef({ items, setItems });

  return (
    <>
      <div className="navbar">
        <ul className="items-box">
          {items.map((e) => {
            return (
              <li className="item">
                <p>{e.name}</p>
              </li>
            );
          })}
        </ul>
        <input type="file" className="file-input"></input>
      </div>
      <div className="container">
        <div className="main-canvas-container">
          <div className="heatmap"></div>
          <div className="internal-canvas-container">
            <canvas className="canvas" ref={canvasRef}></canvas>
          </div>
        </div>
        <div className="toolbox-container">
          <div className="zoom-buttons">
            <button onClick={() => zoomCanvas(fabricRef.current as fabric.Canvas, "in")}>+</button>
            <button onClick={() => zoomCanvas(fabricRef.current as fabric.Canvas, "out")}>-</button>
            <button onClick={() => zoomCanvas(fabricRef.current as fabric.Canvas, "reset")}>Reset</button>
          </div>

          <div className="pan-buttons">
            <button
              style={{ gridColumn: "1", gridRow: "2" }}
              onClick={() => panCanvas(fabricRef.current as fabric.Canvas, "left")}
            >
              <HiArrowLeft />
            </button>
            <button
              style={{ gridColumn: "2", gridRow: "1" }}
              onClick={() => panCanvas(fabricRef.current as fabric.Canvas, "up")}
            >
              <HiArrowUp />
            </button>
            <button
              style={{ gridColumn: "2", gridRow: "3" }}
              onClick={() => panCanvas(fabricRef.current as fabric.Canvas, "down")}
            >
              <HiArrowDown />
            </button>
            <button
              style={{ gridColumn: "3", gridRow: "2" }}
              onClick={() => panCanvas(fabricRef.current as fabric.Canvas, "right")}
            >
              <HiArrowRight />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
