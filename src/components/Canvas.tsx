/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useToast } from "@chakra-ui/react";
import { RangeDatepicker } from "chakra-dayzed-datepicker";
import { getAvg } from "../utils/tempHandler";
import { fabric } from "fabric";
import h337, { HeatmapConfiguration } from "heatmap.js";
import { HiOutlineStatusOnline, HiOutlineSave, HiFolderOpen, HiDownload, HiTrash } from "react-icons/hi";
import PanButtons from "./PanButtons";
// import { initialData } from "../utils/samplePinData";
import RadiusSlider from "../components/RadiusSlider";
// import { RangeDatepicker } from "chakra-dayzed-datepicker";
import "./canvas.css";
import { createPin, updateTemp } from "../utils/objectHandlers";
import { produce } from "immer";
import ZoomSlider from "./ZoomSlider";
import { Icon, Tooltip } from "@chakra-ui/react";
import PinDetails from "./PinDetails";
import { getPDFImageObject } from "../utils/pdfHandler";
import { addDxfToCanvas } from "../utils/dxfHandler";
import StrokeWidthSlider from "./StrokeWidthSlider";
import { format } from "date-fns";
import { calculateHeatMap } from "../utils/heatmapHandler";
import { useGetSensorsQuery } from "../services/api";
// import { useNavigate } from "react-router-dom";

export default function Canvas({ mode }: { mode: string }) {
  const toast = useToast();
  const toastRef = useRef(toast);

  const canvasRef = useRef(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  const [loaded, setLoaded] = useState(false);

  const calculateHeatMapRef = useRef(calculateHeatMap);
  // const initialItems = [];
  const [selectedDates, setSelectedDates] = useState<Date[]>([new Date("2023-10-10"), new Date("2023-11-09")]);
  const dateRef = useRef(selectedDates);

  const [radius, setRadius] = useState<number>(100);
  const radiusRef = useRef(radius);
  const [canvasList, setCanvasList] = useState<any[]>([]);

  const pushToCanvasList = (canvas: fabric.Canvas | null) => {
    if (!canvas) {
      return;
    }
    const json = canvas.toJSON(["hasControls", "name", "temp", "selectable", "type", "id", "radius"]);
    setCanvasList([...canvasList, json]);
  };

  const loadPageFromCanvasList = (canvas: fabric.Canvas | null, pageId: string) => {
    const json = canvasList.filter((e, i) => i == pageId)[0];
    if (!json) {
      return;
    }
    canvas.loadFromJSON(JSON.parse(json), () => {
      if (!mainCanvasRef.current) {
        return;
      }

      initHeatmap(mainCanvasRef.current?.clientWidth, mainCanvasRef.current?.clientHeight);
      // update the items state according to the imported json
      setTimeout(() => {
        const objects = canvas.getObjects();
        const planObject = objects.filter((e) => e.name === "plan")[0];
        if (planObject) {
          planObject.sendToBack();
        }
        setLoaded(true);
        resolve();
      }, 1000);
      calculateHeatMap(canvas, heatmapRef.current, radius);
    });
  };
  //automatically refetches when selected dates are updated
  const {
    data,
    isLoading: loading,
    error,
  } = useGetSensorsQuery(
    {
      start: selectedDates[0] ? format(selectedDates[0], "yyyy-MM-dd hh:mm:ss") : null,
      end: selectedDates[1] ? format(selectedDates[1], "yyyy-MM-dd hh:mm:ss") : null,
    },
    { skip: selectedDates.length < 2 }
  );

  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // const [selectedDates, setSelectedDates] = useState<Date[]>([new Date(), new Date()]);

  const initFabric = (width: number, height: number) => {
    fabricRef.current = new fabric.Canvas(canvasRef.current, { preserveObjectStacking: true });
    fabricRef.current.setWidth(width);
    fabricRef.current.setHeight(height);
    fabricRef.current
      .on("drop", (e) => {
        if (!fabricRef.current) {
          return;
        }
        const { x, y } = fabricRef.current.getPointer(e.e);
        const id = e.e.dataTransfer.getData("text");
        const currentObj = itemsRef.current.filter((e) => e.id === id)[0];
        if (currentObj.used === false) {
          //check if it is dropped on either plan or heatmap, cannot be dropped outside
          if (e.target?.name == "plan" || e.target?.name == "heatmap") {
            // filter date array to date range(using ref)
            console.log(dataRef.current.data);
            const dataArray = dataRef.current.data[currentObj.name];
            const avgTemp = getAvg(dataArray);
            //create pin
            createPin(x, y, avgTemp, currentObj.id, currentObj.name, currentObj.radius, fabricRef.current);
            // mark pin as used inside items state
            removeRef.current(id);
          } else {
            // console.log("object cannot go outside floor plan");
            toastRef.current({ status: "warning", title: "Cannot place object outside floor plan!" });
          }
        }
        calculateHeatMapRef.current(fabricRef.current, heatmapRef.current, radiusRef.current);
      })
      .on("object:added", (e) => {
        fabricRef.current?.forEachObject(function (obj) {
          if (obj === e.target || obj.name !== "plan") return;
          // check if object is outside the floor plan and if yes destroy the object
          if (e.target?.name == "pin" && !e.target.intersectsWithObject(obj)) {
            console.log("object cannot go outside floor plan");
            toastRef.current({ status: "warning", title: "Cannot place object outside floor plan!" });
            deleteRef.current(e.target?.id, fabricRef.current);
          }
        });
        calculateHeatMapRef.current(fabricRef.current, heatmapRef.current, radiusRef.current);
      })
      .on("object:moving", () => {
        calculateHeatMapRef.current(fabricRef.current, heatmapRef.current, radiusRef.current);
      })
      .on("object:modified", (e) => {
        fabricRef.current?.forEachObject(function (obj) {
          if (obj === e.target || obj.name !== "plan") return;
          // check if object is outside the floor plan and if yes destroy the object
          if (e.target?.name == "pin" && !e.target.intersectsWithObject(obj)) {
            console.log("object cannot go outside floor plan");
            toastRef.current({ status: "warning", title: "Cannot place object outside floor plan!" });
            deleteRef.current(e.target?.id, fabricRef.current);
          }
        });

        calculateHeatMapRef.current(fabricRef.current, heatmapRef.current, radiusRef.current);
      })
      .on("selection:updated", () => {
        // if a selection is made and theres more than one selected object, reject that selection
        // to prevent user from selecting more than one object at a time
        const selectedObjects = fabricRef.current?.getActiveObjects();
        if (selectedObjects) {
          if (selectedObjects.length == 1) {
            setPinRef.current(selectedObjects[0].id);
          } else if (selectedObjects.length > 1) {
            fabricRef.current?.discardActiveObject();
          }
        }
        calculateHeatMapRef.current(fabricRef.current, heatmapRef.current, radiusRef.current);
      })
      .on("selection:created", (e) => {
        if (!e.selected) {
          return;
        }
        if (e.selected.length == 1) {
          // set pin ref to current selected id, this is referenced again to show appropriate pin details
          setPinRef.current(e.selected[0].id);
        } else if (e.selected.length > 1) {
          // prevents selection of more than one object
          fabricRef.current?.discardActiveObject();
        }
      })
      .on("selection:cleared", () => {
        //clear selection
        setPinRef.current(null);
      })
      .on("object:removed", () => {
        calculateHeatMapRef.current(fabricRef.current, heatmapRef.current, radiusRef.current);
      })
      .on("mouse:down", function (opt) {
        const evt = opt.e;
        if (evt.altKey === true) {
          fabricRef.current.isDragging = true;
          fabricRef.current.selection = false;
          fabricRef.current.lastPosX = evt.clientX;
          fabricRef.current.lastPosY = evt.clientY;
        }
      })
      .on("mouse:move", function (opt) {
        if (fabricRef.current.isDragging) {
          const e = opt.e;
          const vpt = fabricRef.current.viewportTransform;
          vpt[4] += e.clientX - fabricRef.current.lastPosX;
          vpt[5] += e.clientY - fabricRef.current.lastPosY;
          fabricRef.current.requestRenderAll();
          fabricRef.current.lastPosX = e.clientX;
          fabricRef.current.lastPosY = e.clientY;
        }
      })
      .on("mouse:up", function () {
        // on mouse up we want to recalculate new interaction
        // for all objects, so we call setViewportTransform
        fabricRef.current.setViewportTransform(fabricRef.current.viewportTransform);
        fabricRef.current.isDragging = false;
        fabricRef.current.selection = true;
      })
      .on("mouse:wheel", function (opt) {
        const delta = opt.e.deltaY;
        let zoom = fabricRef.current.getZoom();
        zoom *= 0.999 ** delta;
        if (zoom > 5) zoom = 5;
        if (zoom < 0.99) zoom = 0.99;
        fabricRef.current.setZoom(zoom);
        opt.e.preventDefault();
        opt.e.stopPropagation();
      });
  };

  const removeFromList = (id: number) => {
    // using immer to handle immutability for state
    setItems(
      produce((draft) => {
        draft.filter((e) => e.id === id)[0].used = true;
      })
    );
  };
  const removeRef = useRef(removeFromList);

  const handleDelete = (id: string, canvas: fabric.Canvas | null) => {
    // deletes particular object from the canvas based on the given id and marks the object as unused in items array
    console.log("Object Deleted");
    if (!canvas) {
      throw new Error("Canvas is null");
    }
    const objects = canvas.getObjects();

    const deleteObject = objects.filter((e) => e.id === id)[0];
    // animate object deletion (fadeout)
    fabric.util.animate({
      startValue: 1,
      endValue: 0,
      duration: 300,
      onChange: (opValue) => {
        deleteObject.opacity = opValue;
        canvas.renderAll();
        calculateHeatMap(fabricRef.current, heatmapRef.current, radius);
      },
      onComplete: () => {
        canvas.remove(deleteObject);
        setItems(
          produce((draft) => {
            draft.filter((e) => e.id === id)[0].used = false;
          })
        );
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
      // create image out of heatmap canvas and add to fabric
      const heatmapImage = new fabric.Image(heatmapCanvasRef.current, {
        selectable: false,
        name: "heatmap",
        excludeFromExport: true,
        opacity: 0.7,
      });
      fabricRef.current?.add(heatmapImage);
      heatmapImage.sendToBack();
    }
    console.log(heatmapRef.current);
    calculateHeatMap(fabricRef.current, heatmapRef.current, radius);
  };

  const disposeFabric = () => {
    fabricRef.current?.dispose();
  };

  const handleResize = () => {
    // resize canvas and regenerate heatmap in case of windowResize
    if (!mainCanvasRef.current) {
      console.log("canvas not loaded");
      return;
    }
    fabricRef.current?.setWidth(mainCanvasRef.current.clientWidth);
    fabricRef.current?.setHeight(mainCanvasRef.current.clientHeight);
    initHeatmap(mainCanvasRef.current.clientWidth, mainCanvasRef.current.clientHeight);
  };

  useEffect(() => {
    if (error) {
      toast({ status: "error", title: "Error fetching Sensor data", description: error.message });
      console.log(error);
    }
    // else if (loading || isUpdating) {
    //   toast({ status: "loading", title: "Sensor Data Loading" });
    // }

    if (data && data.data) {
      toast({ status: "success", title: "Sensor Data Loaded!" });
      console.log(data);
      const itemsArray = Object.entries(data.data).map((e, i) => {
        return {
          id: e[0],
          name: e[0],
          used: items.length > 0 ? items[i].used : false,
        };
      });
      setItems(itemsArray);
      calculateHeatMap(fabricRef.current, heatmapRef.current, radius);
    }
  }, [data, loading, error, toast]);

  useEffect(() => {
    radiusRef.current = radius;

    if (!fabricRef.current || !heatmapRef.current || !loaded) return;
    calculateHeatMap(fabricRef.current, heatmapRef.current, radius);
  }, [radius]);

  useEffect(() => {
    if (!mainCanvasRef.current) {
      console.log("canvas not loaded");
      return;
    }

    initFabric(mainCanvasRef.current.clientWidth, mainCanvasRef.current.clientHeight);
    initHeatmap(mainCanvasRef.current.clientWidth, mainCanvasRef.current.clientHeight);
    window.addEventListener("resize", handleResize);

    //load from localstorage and disable movements

    if (mode === "view") {
      const promise = LoadFromLocalStorage(fabricRef.current);
      toast.promise(promise, {
        position: "top",
        success: { title: "Success!", description: "Loaded from Local Storage" },
        error: { title: "Failed!", description: "Something wrong" },
        loading: { title: "Loading...", description: "Please wait" },
      });
      setTimeout(() => {
        setLoaded(false);
        const allObjects = fabricRef.current.getObjects();
        allObjects.forEach((e) => {
          // console.log("before edit", e);
          e.lockMovementX = true;
          e.lockMovementY = true;
          e.lockRotation = true;
          e.lockScalingX = true;
          e.lockScalingY = true;
          e.lockSkewingX = true;
          e.lockSkewingY = true;
          // e.selectable = false;
          // console.log("after edit", e);
        });
      }, 1000);
    }

    return () => {
      disposeFabric();
    };
  }, []);

  // serialise to json and save to localStorage
  const saveToLocalStorage = async (canvas: fabric.Canvas | null) => {
    return new Promise<void>(function (resolve, reject) {
      try {
        if (!canvas) {
          throw new Error("Canvas not initialized");
        }
        // specify object properties to include in json serialisation
        // const json = canvas.toJSON(["hasControls", "name", "temp", "selectable", "type", "id", "radius"]);
        window.localStorage.setItem("json", JSON.stringify(canvasList));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
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
        setCanvasList(JSON.parse(json));
        // canvas.loadFromJSON(JSON.parse(json), () => {
        //   if (!mainCanvasRef.current) {
        //     return;
        //   }

        //   initHeatmap(mainCanvasRef.current?.clientWidth, mainCanvasRef.current?.clientHeight);
        //   // update the items state according to the imported json
        //   setTimeout(() => {
        //     const objects = canvas.getObjects();
        //     const planObject = objects.filter((e) => e.name === "plan")[0];
        //     if (planObject) {
        //       planObject.sendToBack();
        //     }
        //     objects
        //       .filter((e) => e.name == "pin")
        //       .forEach((e) => {
        //         removeFromList(e.id);
        //       });
        //     setLoaded(true);
        //     resolve();
        //   }, 1000);
        //   calculateHeatMap(canvas, heatmapRef.current, radius);
        // });
      } catch (error) {
        reject(error);
      }
    });
  };

  const [fileType, setFileType] = useState("");
  const handleInput = async (e: ChangeEvent<HTMLInputElement>) => {
    try {
      if (!fabricRef.current) {
        throw new Error("Canvas not Loaded");
      }

      if (!e.target.files || e.target.files.length < 1) {
        throw new Error("Files not Uploaded");
      }

      const fileExtension = e.target.files[0].name.split(".").slice(-1)[0];
      if (fileExtension === "dxf") {
        console.log("dxf");
        setFileType("dxf");
        await addDxfToCanvas(e.target.files[0], fabricRef.current);
        toast({ status: "success", title: "Loaded DXF File" });
        toast({ status: "info", title: "Increase stroke width if floor plan is barely visible" });
      } else if (fileExtension === "pdf") {
        console.log("pdf");
        const tmppath = URL.createObjectURL(e.target.files[0]);
        await getPDFImageObject(tmppath, fabricRef.current);
        toast({ status: "success", title: "Loaded PDF File" });
      } else {
        throw new Error("wrong file extension!!");
      }
      if (mode === "edit") {
        setLoaded(true);
      }
    } catch (err) {
      toast({ status: "error", title: "An Error Occured" });
    }
  };

  const [url, setUrl] = useState("");

  const convertToImage = (canvas: fabric.Canvas | null) => {
    if (!canvas) {
      throw new Error("Canvas not Loaded");
    }
    return canvas.toDataURL() as string;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = useState<any[]>([]);
  const itemsRef = useRef(items);

  // keep the items and date refs updated when the state changes
  useEffect(() => {
    itemsRef.current = items;
    dateRef.current = selectedDates;
  }, [items, selectedDates]);

  // change the pin details and heatmap based on the date range
  useEffect(() => {
    items
      .filter((e) => e.used === true)
      .forEach((e) => {
        console.log(e);
        // console.log(dataRef.current);
        const dataArray = dataRef.current.data[e.name];
        console.log(dataArray);
        const newTemp = getAvg(dataArray);
        updateTemp(fabricRef.current, newTemp, e.id);
      });
    calculateHeatMap(fabricRef.current, heatmapRef.current, radius);
  }, [data]);

  const mainCanvasRef = useRef<HTMLDivElement>(null);
  const [currentPin, setCurrentPin] = useState(null);
  const setPinRef = useRef(setCurrentPin);
  // const navigate = useNavigate();
  return (
    <>
      <div className="navbar">
        {mode === "edit" && <input type="file" className="file-input" onChange={handleInput} />}
        <div className="pageList">
          {canvasList ? (
            canvasList.map((canvas, i) => {
              return <div>{i}</div>;
            })
          ) : (
            <div>CanvasList empty</div>
          )}
        </div>
      </div>
      <div className="container">
        <div className="main-canvas-container" ref={mainCanvasRef}>
          <div className="internal-canvas-container">
            <canvas className="canvas" ref={canvasRef}></canvas>
          </div>
          {/* <div className="heatmap"></div> */}
        </div>
        <div className="toolbox-container">
          {/* <RangeDatepicker selectedDates={selectedDates} onDateChange={setSelectedDates} /> */}
          {mode === "edit" && fileType === "dxf" ? <StrokeWidthSlider canvas={fabricRef.current} /> : null}
          <ZoomSlider canvas={fabricRef.current} />
          {loaded && (
            <RadiusSlider
              canvas={fabricRef.current}
              heatmap={heatmapRef.current}
              radius={radius}
              setRadius={setRadius}
            />
          )}
          <PanButtons canvas={fabricRef.current} />
          <div className="date-picker-container">
            <RangeDatepicker selectedDates={selectedDates} onDateChange={setSelectedDates} />
          </div>
          <div className="save-buttons">
            {mode === "edit" && (
              <Icon
                as={HiFolderOpen}
                boxSize={6}
                style={{ margin: "10px", cursor: "pointer" }}
                onClick={async () => {
                  const promise = LoadFromLocalStorage(fabricRef.current);
                  toast.promise(promise, {
                    position: "top",
                    success: { title: "Success!", description: "Loaded from Local Storage" },
                    error: { title: "Failed!", description: "Something wrong" },
                    loading: { title: "Loading...", description: "Please wait" },
                  });
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
                    const promise = saveToLocalStorage(fabricRef.current);
                    toast.promise(promise, {
                      success: { title: "Success!", description: "Saved to Local Storage" },
                      error: { title: "Failed!", description: "Something wrong" },
                      loading: { title: "Loading...", description: "Please wait" },
                    });
                  }}
                />
                <Icon
                  as={HiDownload}
                  boxSize={6}
                  style={{ margin: "10px", cursor: "pointer" }}
                  onClick={() => {
                    const imgurl = convertToImage(fabricRef.current);
                    setUrl(imgurl);
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
                          // attach id of the current item to the drag event
                          ev.dataTransfer.setData("text/plain", e.id);
                        }}
                        key={i}
                        className="item"
                      >
                        <Tooltip label={e.name} fontSize="md">
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
                          handleDelete(e.id, fabricRef.current);
                        }}
                        key={i}
                        style={{ backgroundColor: "#cbd5e1" }}
                        className="item"
                      >
                        <Tooltip label={e.name} fontSize="md">
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
          ) : mode === "edit" ? (
            <div>Please load a floor plan</div>
          ) : null}
          {currentPin && <PinDetails currentPinId={currentPin} data={data} items={items} dateRange={selectedDates} />}
        </div>
      </div>
    </>
  );
}
