import { useEffect, useRef } from "react";
import { fabric } from "fabric";
import h337, { HeatmapConfiguration } from "heatmap.js";
import { sampleData } from "../utils/sampleHeatmap";
import "./canvas.css";

export default function Canvas() {
  const canvasRef = useRef(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  const initFabric = () => {
    fabricRef.current = new fabric.Canvas(canvasRef.current);
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
    initFabric();
    initHeatmap();
    return () => {
      disposeFabric();
    };
  }, []);

  return (
    <div className="container">
      <div className="main-canvas-container">
        <div className="heatmap"></div>
        <div className="internal-canvas-container">
          <canvas className="canvas" ref={canvasRef} width={900} height={800}></canvas>
        </div>
      </div>
      <div className="toolbox-container">a</div>
    </div>
  );
}
