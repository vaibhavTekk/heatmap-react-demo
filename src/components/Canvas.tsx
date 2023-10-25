import { ChangeEvent, useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import h337, { HeatmapConfiguration } from "heatmap.js";
import {
  HiArrowUp,
  HiArrowDown,
  HiArrowLeft,
  HiArrowRight,
  HiOutlineStatusOnline,
  HiOutlineRefresh,
  HiOutlineSave,
  HiFolderOpen,
  HiDownload,
} from "react-icons/hi";
import { HiMagnifyingGlass, HiMiniSignal } from "react-icons/hi2";
import { TbZoomReset } from "react-icons/tb";
import { Helper } from "dxf/dist/dxf";

import "./canvas.css";
import { panCanvas, zoomCanvas, zoomCanvasToValue } from "../utils/ZoomPanHandlers";
import { createPin } from "../utils/objectHandlers";
import { produce } from "immer";

import imgUrl from "/signal-stream.png";

export default function Canvas() {
  const canvasRef = useRef(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  const [loaded, setLoaded] = useState(false);

  const initFabric = (width: number, height: number) => {
    fabricRef.current = new fabric.Canvas(canvasRef.current);
    fabricRef.current.setWidth(width);
    fabricRef.current.setHeight(height);
    fabricRef.current
      .on("drop", (e) => {
        const { x, y } = fabricRef.current.getPointer(e.e);
        const id = parseInt(e.e.dataTransfer.getData("text"));
        const currentObj = itemsRef.current.filter((e) => e.id === id)[0];
        console.log(currentObj.used);
        if (currentObj.used === false) {
          createPin(x, y, currentObj.temp, currentObj.id, fabricRef.current);
          removeRef.current(id);
        }
        // console.log(fabricRef.current);
      })
      .on("object:added", () => {
        calculateHeatMap();
      })
      .on("object:moving", () => {
        calculateHeatMap();
      })
      .on("object:modified", () => {
        calculateHeatMap();
      })
      .on("selection:updated", () => {
        calculateHeatMap();
      });
  };

  const removeFromList = (id: number) => {
    setItems(
      produce((draft) => {
        draft.filter((e) => e.id === id)[0].used = true;
      })
    );
    itemsRef.current = items;
  };
  const removeRef = useRef(removeFromList);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const heatmapRef = useRef<any>(null);
  const heatmapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const initHeatmap = (width: number, height: number) => {
    // delete existing heatmap div if it exists and create new heatmap
    // const mainContainer: HTMLElement = document.getElementsByClassName("main-canvas-container")[0] as HTMLElement;
    let container: HTMLElement = document.getElementsByClassName("heatmap")[0] as HTMLElement;
    if (container) {
      console.log("heatmap already exists, deleting");
      container.remove();
    }
    container = document.createElement("div");
    container.className = "heatmap";
    mainCanvasRef.current?.appendChild(container);
    container.style.height = height + "px";
    container.style.width = width + "px";

    // delete existing heatmap object in the canvas if it exists
    const allObjects = fabricRef.current?.getObjects();
    allObjects
      ?.filter((e) => e.type === "heatmap")
      .forEach((e) => {
        fabricRef.current?.remove(e);
      });

    const config: HeatmapConfiguration = {
      container,
    };
    heatmapRef.current = h337.create(config);
    heatmapCanvasRef.current = heatmapRef.current._renderer.canvas;
    if (heatmapCanvasRef.current) {
      const heatmapImage = new fabric.Image(heatmapCanvasRef.current, {
        selectable: false,
        type: "heatmap",
        excludeFromExport: true,
      });
      fabricRef.current?.add(heatmapImage);
      heatmapImage.sendToBack();
    }
    calculateHeatMap();
  };

  const disposeFabric = () => {
    fabricRef.current?.dispose();
  };

  const calculateHeatMap = () => {
    let max = -100;
    const points = fabricRef.current?._objects
      .filter((e) => e.name === "pin")
      .map((e) => {
        max = Math.max(e.temp, max);
        return { x: e.left + 20, y: e.top + 20, value: e.temp, radius: 200 };
      });
    heatmapRef.current.setData({ max, data: points });
  };

  const handleResize = () => {
    if (!mainCanvasRef.current) {
      console.log("canvas not loaded");
      return;
    }
    fabricRef.current?.setWidth(mainCanvasRef.current.clientWidth);
    fabricRef.current?.setHeight(mainCanvasRef.current.clientHeight);
    initHeatmap(mainCanvasRef.current.clientWidth, mainCanvasRef.current.clientHeight);
  };

  useEffect(() => {
    if (!mainCanvasRef.current) {
      console.log("canvas not loaded");
      return;
    }

    initFabric(mainCanvasRef.current.clientWidth, mainCanvasRef.current.clientHeight);
    initHeatmap(mainCanvasRef.current.clientWidth, mainCanvasRef.current.clientHeight);

    window.addEventListener("resize", handleResize);

    return () => {
      disposeFabric();
    };
  }, []);

  const saveToLocalStorage = (canvas: fabric.Canvas | null) => {
    if (!canvas) {
      throw new Error("Canvas not initialized");
    }
    const json = canvas.toJSON(["hasControls", "name", "temp", "selectable"]);
    window.localStorage.setItem("json", JSON.stringify(json));
  };

  const LoadFromLocalStorage = (canvas: fabric.Canvas | null) => {
    if (!canvas || !mainCanvasRef.current.clientWidth || !mainCanvasRef.current.clientHeight) {
      throw new Error("Canvas not initialized");
    }

    const json = window.localStorage.getItem("json");
    if (!json) {
      throw new Error("Invalid JSON Data");
    }
    canvas.loadFromJSON(JSON.parse(json), () => {
      initHeatmap(mainCanvasRef.current?.clientWidth, mainCanvasRef.current?.clientHeight);
    });
  };

  const readFileContent = (file: File) => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = (event) => resolve(event.target?.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

  const handleInput = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!fabricRef.current) {
      throw new Error("Canvas not Loaded");
    }

    try {
      const content = await readFileContent(e.target.files[0]);
      const helper = new Helper(content);
      const svg = helper.toSVG();
      // const svg = sampleSvg;
      // console.log(svg);

      fabric.loadSVGFromString(svg, (objects, options) => {
        objects.forEach((object) => {
          object.strokeWidth = 2;
        });
        const obj = fabric.util.groupSVGElements(objects, options);
        obj.name = "plan";
        obj.selectable = false;
        obj
          .scaleToHeight(fabricRef.current.height * (3 / 4))
          .set({ left: fabricRef.current.width / 2, top: fabricRef.current.height / 2, strokeWidth: 12 })
          .setCoords();
        fabricRef.current.add(obj).centerObject(obj).renderAll();
        obj.setCoords();
        // obj.sendToBack();
        setLoaded(true);
      });
    } catch (err) {
      console.log(err);
    }
  };

  const [url, setUrl] = useState("");

  const convertToImage = () => {
    setUrl(fabricRef.current?.toDataURL() as string);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = useState<any[]>([
    { id: 1, name: "Sensor1", temp: 36.5, used: false },
    { id: 2, name: "Sensor2", temp: 29.5, used: false },
    { id: 3, name: "Sensor3", temp: 38.5, used: false },
    { id: 4, name: "Sensor4", temp: 25.5, used: false },
    { id: 5, name: "Sensor5", temp: 30.8, used: false },
    { id: 6, name: "Sensor6", temp: 21.5, used: false },
    { id: 7, name: "Sensor7", temp: 27.5, used: false },
    { id: 8, name: "Sensor4", temp: 25.5, used: false },
    { id: 9, name: "Sensor5", temp: 30.8, used: false },
    { id: 10, name: "Sensor6", temp: 21.5, used: false },
    { id: 11, name: "Sensor7", temp: 27.5, used: false },
  ]);
  const itemsRef = useRef(items);

  const mainCanvasRef = useRef<HTMLElement>(null);

  const [zoom, setZoom] = useState(1);

  return (
    <>
      <div className="navbar">
        <input type="file" className="file-input" onChange={handleInput}></input>
      </div>
      <div className="container">
        <div className="main-canvas-container" ref={mainCanvasRef}>
          <div className="internal-canvas-container">
            <canvas className="canvas" ref={canvasRef}></canvas>
          </div>
          {/* <div className="heatmap"></div> */}
        </div>
        <div className="toolbox-container">
          <div className="zoom-buttons">
            <input
              type="range"
              min={0.2}
              max={3.0}
              step="0.1"
              value={zoom}
              onChange={(e) => {
                setZoom(parseFloat(e.target.value));
                zoomCanvasToValue(fabricRef.current, zoom);
              }}
            />
            <button
              onClick={() => {
                zoomCanvas(fabricRef.current, "reset");
                setZoom(1);
              }}
            >
              <TbZoomReset />
            </button>
          </div>

          <div className="pan-buttons">
            <button style={{ gridColumn: "1", gridRow: "2" }} onClick={() => panCanvas(fabricRef.current, "left")}>
              <HiArrowLeft />
            </button>
            <button style={{ gridColumn: "2", gridRow: "1" }} onClick={() => panCanvas(fabricRef.current, "up")}>
              <HiArrowUp />
            </button>
            <button style={{ gridColumn: "2", gridRow: "2" }} onClick={() => panCanvas(fabricRef.current, "reset")}>
              <HiOutlineRefresh />
            </button>
            <button style={{ gridColumn: "2", gridRow: "3" }} onClick={() => panCanvas(fabricRef.current, "down")}>
              <HiArrowDown />
            </button>
            <button style={{ gridColumn: "3", gridRow: "2" }} onClick={() => panCanvas(fabricRef.current, "right")}>
              <HiArrowRight />
            </button>
          </div>
          <div className="save-buttons">
            <button
              onClick={() => {
                LoadFromLocalStorage(fabricRef.current);
              }}
            >
              <HiFolderOpen />
            </button>
            {loaded && (
              <>
                <button
                  onClick={() => {
                    saveToLocalStorage(fabricRef.current);
                  }}
                >
                  <HiOutlineSave />
                </button>
                <button
                  onClick={() => {
                    convertToImage();
                  }}
                >
                  <HiDownload />
                </button>
                {url && (
                  <a href={url} download>
                    Download
                  </a>
                )}
              </>
            )}
          </div>
          {loaded ? (
            <>
              <ul className="items-box">
                {items.map((e, i) => {
                  let style = {};
                  if (e.used) {
                    style = { backgroundColor: "gray" };
                  }
                  return (
                    <li
                      draggable={!e.used}
                      onDragStart={(ev) => {
                        ev.dataTransfer.setData("text/plain", e.id);
                      }}
                      key={i}
                      style={style}
                      className="item"
                    >
                      <HiOutlineStatusOnline size={30} />
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <div>Please load a floor plan</div>
          )}
        </div>
      </div>
    </>
  );
}
