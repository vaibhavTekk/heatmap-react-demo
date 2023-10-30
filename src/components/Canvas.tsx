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
  HiTrash,
} from "react-icons/hi";

import { TbZoomReset } from "react-icons/tb";
import { Helper } from "dxf/dist/dxf";

import "./canvas.css";
import { panCanvas, zoomCanvas, zoomCanvasToValue } from "../utils/ZoomPanHandlers";
import { createPin } from "../utils/objectHandlers";
import { produce } from "immer";

import { Text, Icon, Slider, SliderFilledTrack, SliderThumb, SliderTrack, Stack, Tooltip } from "@chakra-ui/react";

export default function Canvas({ mode }: { mode: string }) {
  const canvasRef = useRef(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  const [loaded, setLoaded] = useState(false);

  const initialItems = [
    { id: 1, name: "Sensor 1", temp: 36.5, used: false, radius: 200 },
    { id: 2, name: "Sensor 2", temp: 29.5, used: false, radius: 200 },
    { id: 3, name: "Sensor 3", temp: 38.5, used: false, radius: 200 },
    { id: 4, name: "Sensor 4", temp: 25.5, used: false, radius: 200 },
    { id: 5, name: "Sensor 5", temp: 30.8, used: false, radius: 200 },
    { id: 6, name: "Sensor 6", temp: 21.5, used: false, radius: 200 },
    { id: 7, name: "Sensor 7", temp: 27.5, used: false, radius: 200 },
    { id: 8, name: "Sensor 8", temp: 25.5, used: false, radius: 200 },
    { id: 9, name: "Sensor 9", temp: 30.8, used: false, radius: 200 },
    { id: 10, name: "Sensor 10", temp: 21.5, used: false, radius: 200 },
    { id: 11, name: "Sensor 11", temp: 27.5, used: false, radius: 200 },
  ];

  const initFabric = (width: number, height: number) => {
    fabricRef.current = new fabric.Canvas(canvasRef.current);
    fabricRef.current.setWidth(width);
    fabricRef.current.setHeight(height);
    fabricRef.current
      .on("drop", (e) => {
        const { x, y } = fabricRef.current.getPointer(e.e);
        const id = parseInt(e.e.dataTransfer.getData("text"));
        const currentObj = itemsRef.current.filter((e) => e.id === id)[0];
        if (currentObj.used === false) {
          if (e.target?.name === "plan" && !fabricRef.current?.isTargetTransparent(e.target, x, y)) {
            createPin(x, y, currentObj.temp, currentObj.id, currentObj.name, currentObj.radius, fabricRef.current);
            removeRef.current(id);
          } else {
            console.log("object cannot go outside floor plan");
          }
        }
        // console.log(fabricRef.current);
      })
      .on("object:added", () => {
        calculateHeatMap();
      })
      .on("object:moving", (e) => {
        fabricRef.current?.forEachObject(function (obj) {
          if (obj === e.target || obj.name !== "plan") return;
          if (e.target?.name == "pin" && fabricRef.current?.isTargetTransparent(obj, e.target?.left, e.target?.top)) {
            console.log("object cannot go outside floor plan");
            deleteRef.current(e.target?.id, fabricRef.current);
          }
          // console.log(obj, e.target?.intersectsWithObject(obj));
        });

        calculateHeatMap();
      })
      .on("object:modified", () => {
        calculateHeatMap();
      })
      .on("selection:updated", (e) => {
        if (e.selected?.length == 1) {
          setPinRef.current(e.selected[0].id);
        }
        // setPinRef.current();
      })
      .on("selection:created", (e) => {
        if (e.selected?.length == 1) {
          setPinRef.current(e.selected[0].id);
        }
      })
      .on("selection:cleared", () => {
        setPinRef.current(null);
      })
      .on("selection:updated", (e) => {
        calculateHeatMap();
      })
      .on("object:removed", () => {
        calculateHeatMap();
      });
  };

  const removeFromList = (id: number) => {
    setItems(
      produce((draft) => {
        draft.filter((e) => e.id === id)[0].used = true;
      })
    );
  };
  const removeRef = useRef(removeFromList);

  const handleDelete = (id: number, canvas: fabric.Canvas | null) => {
    console.log("Object Deleted");
    if (!canvas) {
      throw new Error("Canvas is null");
    }
    const objects = canvas.getObjects();
    setItems(
      produce((draft) => {
        draft.filter((e) => e.id === id)[0].used = false;
      })
    );

    const deleteObject = objects.filter((e) => e.id === id)[0];
    // animate object deletion (fadeout)
    fabric.util.animate({
      startValue: 1,
      endValue: 0,
      duration: 300,
      onChange: (opValue) => {
        deleteObject.opacity = opValue;
        canvas.renderAll();
        calculateHeatMap();
      },
      onComplete: () => {
        canvas.remove(deleteObject);
      },
      easing: fabric.util.ease.easeOutCubic,
    });
  };
  const deleteRef = useRef(handleDelete);

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
      ?.filter((e) => e.name === "heatmap")
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
        name: "heatmap",
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
        return { x: e.left + 20, y: e.top + 20, value: e.temp * e.opacity, radius: e.radius };
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

    if (mode === "view") {
      LoadFromLocalStorage(fabricRef.current);
      setTimeout(() => {
        setLoaded(false);
        const allObjects = fabricRef.current?.getObjects();
        allObjects?.forEach((e) => {
          // console.log("before edit", e);
          e.lockMovementX = true;
          e.lockMovementY = true;
          e.lockRotation = true;
          e.lockScalingX = true;
          e.lockScalingY = true;
          e.lockSkewingX = true;
          e.lockSkewingY = true;
          e.selectable = false;
          // console.log("after edit", e);
        });
      }, 1000);
    }

    return () => {
      disposeFabric();
    };
  }, []);

  const saveToLocalStorage = (canvas: fabric.Canvas | null) => {
    if (!canvas) {
      throw new Error("Canvas not initialized");
    }
    const json = canvas.toJSON(["hasControls", "name", "temp", "selectable", "type", "id", "radius"]);
    window.localStorage.setItem("json", JSON.stringify(json));
  };

  const LoadFromLocalStorage = async (canvas: fabric.Canvas | null) => {
    return new Promise<void>(function (resolve, reject) {
      try {
        if (!canvas || !mainCanvasRef.current?.clientWidth || !mainCanvasRef.current?.clientHeight) {
          throw new Error("Canvas not initialized");
        }
        const json = window.localStorage.getItem("json");
        if (!json) {
          throw new Error("Invalid JSON Data");
        }
        canvas.loadFromJSON(JSON.parse(json), () => {
          setItems(initialItems);
          initHeatmap(mainCanvasRef.current?.clientWidth, mainCanvasRef.current?.clientHeight);
          setTimeout(() => {
            const objects = canvas.getObjects();
            objects
              .filter((e) => e.name == "pin")
              .forEach((e) => {
                removeFromList(e.id);
              });
            setLoaded(true);
            resolve();
          }, 1000);
        });
      } catch (error) {
        reject(error);
      }
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
          object.fill = "rgb(255,255,255,0.01)";
        });
        const obj = fabric.util.groupSVGElements(objects, options);
        obj.name = "plan";
        obj.selectable = false;
        obj
          .scaleToHeight(fabricRef.current?.getHeight() * (3 / 4))
          .set({
            left: fabricRef.current?.getWidth() / 2,
            top: fabricRef.current.getHeight() / 2,
            strokeWidth: 12,
          })
          .setCoords();
        fabricRef.current?.add(obj).centerObject(obj).renderAll();
        obj.setCoords();
        // obj.sendToBack();
        if (mode === "edit") {
          setLoaded(true);
        }
        obj.perPixelTargetFind = true;
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
  const [items, setItems] = useState<any[]>(initialItems);
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const mainCanvasRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);

  const [currentPin, setCurrentPin] = useState(null);
  const setPinRef = useRef(setCurrentPin);
  return (
    <>
      {mode === "edit" && (
        <div className="navbar">
          <input type="file" className="file-input" onChange={handleInput}></input>
        </div>
      )}
      <div className="container">
        <div className="main-canvas-container" ref={mainCanvasRef}>
          <div className="internal-canvas-container">
            <canvas className="canvas" ref={canvasRef}></canvas>
          </div>
          {/* <div className="heatmap"></div> */}
        </div>
        <div className="toolbox-container">
          <div className="zoom-buttons">
            <Slider
              aria-label="slider-ex-4"
              step={parseFloat("0.1")}
              max={parseFloat("3.0")}
              min={parseFloat("0.2")}
              value={zoom}
              onChange={(e) => {
                setZoom(e);
                zoomCanvasToValue(fabricRef.current, zoom);
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
                zoomCanvas(fabricRef.current, "reset");
                setZoom(1);
              }}
            />
          </div>

          <div className="pan-buttons">
            <Icon
              as={HiArrowLeft}
              style={{ gridColumn: "1", gridRow: "2", cursor: "pointer" }}
              boxSize={6}
              onClick={() => panCanvas(fabricRef.current, "left")}
            />
            <Icon
              as={HiArrowUp}
              style={{ gridColumn: "2", gridRow: "1", cursor: "pointer" }}
              boxSize={6}
              onClick={() => panCanvas(fabricRef.current, "up")}
            />
            <Icon
              as={HiOutlineRefresh}
              style={{ gridColumn: "2", gridRow: "2", cursor: "pointer" }}
              boxSize={6}
              onClick={() => panCanvas(fabricRef.current, "reset")}
            />
            <Icon
              as={HiArrowDown}
              style={{ gridColumn: "2", gridRow: "3", cursor: "pointer" }}
              boxSize={6}
              onClick={() => panCanvas(fabricRef.current, "down")}
            />
            <Icon
              as={HiArrowRight}
              style={{ gridColumn: "3", gridRow: "2", cursor: "pointer" }}
              boxSize={6}
              onClick={() => panCanvas(fabricRef.current, "right")}
            />
          </div>
          <div className="save-buttons">
            {mode === "edit" && (
              <Icon
                as={HiFolderOpen}
                boxSize={6}
                style={{ margin: "10px", cursor: "pointer" }}
                onClick={async () => {
                  await LoadFromLocalStorage(fabricRef.current);
                }}
              />
            )}
            {loaded && mode === "edit" && (
              <>
                <Icon
                  as={HiOutlineSave}
                  boxSize={6}
                  style={{ margin: "10px", cursor: "pointer" }}
                  onClick={() => {
                    saveToLocalStorage(fabricRef.current);
                  }}
                />
                <Icon
                  as={HiDownload}
                  boxSize={6}
                  style={{ margin: "10px", cursor: "pointer" }}
                  onClick={() => {
                    convertToImage();
                  }}
                />
                {url && (
                  <a href={url} download>
                    Download
                  </a>
                )}
              </>
            )}
          </div>
          {loaded && mode === "edit" ? (
            <>
              <ul className="items-box">
                {items.map((e, i) => {
                  if (e.used === false) {
                    return (
                      <li
                        draggable={!e.used}
                        onDragStart={(ev) => {
                          ev.dataTransfer.setData("text/plain", e.id);
                        }}
                        key={i}
                        className="item"
                      >
                        <Tooltip label={e.name + " " + e.temp + "\xB0C"} fontSize="md">
                          <span>
                            <HiOutlineStatusOnline size={30} />
                          </span>
                        </Tooltip>
                      </li>
                    );
                  } else {
                    return (
                      <li
                        onClick={() => {
                          handleDelete(parseInt(e.id), fabricRef.current);
                        }}
                        key={i}
                        style={{ backgroundColor: "#cbd5e1" }}
                        className="item"
                      >
                        <Tooltip label={e.name + " " + e.temp + "\xB0C"} fontSize="md">
                          <span>
                            <HiTrash size={30} />
                          </span>
                        </Tooltip>
                      </li>
                    );
                  }
                })}
              </ul>
            </>
          ) : (
            <div>Please load a floor plan</div>
          )}
          {currentPin && (
            <Stack spacing={1} style={{ width: "70%", marginTop: "12px" }}>
              <Text fontSize="2xl" as="b">
                Pin Details:
              </Text>
              <Text fontSize="md">Pin ID: {currentPin}</Text>
              <Text fontSize="md">Pin Name: {items.filter((e) => e.id === currentPin)[0].name}</Text>
              <Text fontSize="md">Temp: {items.filter((e) => e.id === currentPin)[0].temp}</Text>
            </Stack>
          )}
        </div>
      </div>
    </>
  );
}
