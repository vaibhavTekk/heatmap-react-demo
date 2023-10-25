import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import h337, { HeatmapConfiguration } from "heatmap.js";
import { HiArrowUp, HiArrowDown, HiArrowLeft, HiArrowRight } from "react-icons/hi";

import "./canvas.css";
import { panCanvas, zoomCanvas } from "../utils/ZoomPanHandlers";

export default function ViewCanvas() {
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
  const initHeatmap = (width: number, height: number) => {
    const mainContainer: HTMLElement = document.getElementsByClassName("main-canvas-container")[0] as HTMLElement;
    let container: HTMLElement = document.getElementsByClassName("heatmap")[0] as HTMLElement;
    if (container) {
      console.log("heatmap already exists, deleting");
      container.remove();
    }
    container = document.createElement("div");
    container.className = "heatmap";
    mainContainer.appendChild(container);
    container.style.height = height + "px";
    container.style.width = width + "px";
    const config: HeatmapConfiguration = {
      container,
    };
    heatmapRef.current = h337.create(config);
    heatmapCanvasRef.current = heatmapRef.current._renderer.canvas;
    // heatmapCanvasRef.current =
    if (heatmapCanvasRef.current) {
      const heatmapImage = new fabric.Image(heatmapCanvasRef.current, {
        selectable: false,
        name: "heatmap",
        excludeFromExport: true,
      });
      fabricRef.current?.add(heatmapImage);
      heatmapImage.sendToBack();
    }
    calculateHeatMap();
    // heatmapRef.current.setData(sampleData);
    // console.log(heatmapRef);
    // console.log(fabricRef.current);
    // console.log("heatmapref", heatmapRef);
  };

  const disposeFabric = () => {
    fabricRef.current?.dispose();
  };

  const calculateHeatMap = () => {
    // console.log(fabricRef.current._objects);
    // console.log("calculating heatmap");
    let max = -100;
    const points = fabricRef.current?._objects
      .filter((e) => e.name === "pin")
      .map((e) => {
        // console.log(e.top, e.left);
        max = Math.max(e.temp, max);
        return { x: e.left, y: e.top, value: e.temp, radius: 200 };
      });
    heatmapRef.current.setData({ max, data: points });
  };

  useEffect(() => {
    heightRef.current = document.getElementsByClassName("main-canvas-container")[0].clientHeight;
    widthRef.current = document.getElementsByClassName("main-canvas-container")[0].clientWidth;

    initFabric(widthRef.current, heightRef.current);
    initHeatmap(widthRef.current, heightRef.current);
    LoadFromLocalStorage(fabricRef.current);
    const allObjects = fabricRef.current.getObjects();
    allObjects.forEach((object: any) => {
      object.lockMovementX = true;
      object.lockMovementY = true;
      object.lockRotation = true;
      object.lockScalingX = true;
      object.lockScalingY = true;
      object.lockSkewingX = true;
      object.lockSkewingY = true;
      object.selectable = false;
    });
    return () => {
      disposeFabric();
    };
  }, []);

  const LoadFromLocalStorage = (canvas: fabric.Canvas | null) => {
    if (!canvas) {
      throw new Error("Canvas not Loaded");
    }
    const json = window.localStorage.getItem("json");
    canvas.loadFromJSON(JSON.parse(json), () => {
      initHeatmap(widthRef.current, heightRef.current);
    });
  };

  const [url, setUrl] = useState("");

  const convertToImage = () => {
    setUrl(fabricRef.current?.toDataURL() as string);
  };

  return (
    <>
      <div className="container">
        <div className="main-canvas-container">
          {/* <div className="heatmap"></div> */}
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
              style={{ gridColumn: "2", gridRow: "2" }}
              onClick={() => panCanvas(fabricRef.current as fabric.Canvas, "reset")}
            >
              <HiArrowDown />
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
          <button
            onClick={() => {
              convertToImage();
            }}
          >
            Convert
          </button>
          {url && (
            <a href={url} download>
              Download
            </a>
          )}
        </div>
      </div>
    </>
  );
}
