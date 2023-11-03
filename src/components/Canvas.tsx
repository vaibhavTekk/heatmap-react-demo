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
import { initialData } from "../utils/samplePinData";
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
// import { useNavigate } from "react-router-dom";

export default function Canvas({ mode }: { mode: string }) {
  const toast = useToast();
  const toastRef = useRef(toast);

  const canvasRef = useRef(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  const [loaded, setLoaded] = useState(false);

  const initialItems = initialData;

  const [selectedDates, setSelectedDates] = useState<Date[]>([new Date(), new Date()]);
  const dateRef = useRef(selectedDates);
  // const [selectedDates, setSelectedDates] = useState<Date[]>([new Date(), new Date()]);

  const initFabric = (width: number, height: number) => {
    fabricRef.current = new fabric.Canvas(canvasRef.current);
    fabricRef.current.setWidth(width);
    fabricRef.current.setHeight(height);
    fabricRef.current
      .on("drop", (e) => {
        if (!fabricRef.current) {
          return;
        }
        const { x, y } = fabricRef.current.getPointer(e.e);
        const id = parseInt(e.e.dataTransfer.getData("text"));
        const currentObj = itemsRef.current.filter((e) => e.id === id)[0];
        if (currentObj.used === false) {
          //check if it is dropped on either plan or heatmap, cannot be dropped outside
          if (e.target?.name == "plan" || e.target?.name == "heatmap") {
            // filter date array to date range(using ref)
            const dataArray = currentObj.data.filter((e: any) => {
              const date = new Date(e.ts);
              return date >= dateRef.current[0] && date <= dateRef.current[1];
            });
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
        calculateHeatMap();
      })
      .on("object:moving", () => {
        calculateHeatMap();
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

        calculateHeatMap();
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
        calculateHeatMap();
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
        calculateHeatMap();
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

  const handleDelete = (id: number, canvas: fabric.Canvas | null) => {
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
        calculateHeatMap();
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
    calculateHeatMap();
  };

  const disposeFabric = () => {
    fabricRef.current?.dispose();
  };

  const calculateHeatMap = () => {
    // generate data points for heatmap according to objects in fabric
    let max = -100;
    const points = fabricRef.current
      ?.getObjects()
      .filter((e) => e.name === "pin" && e.temp !== 0)
      .map((e) => {
        max = Math.max(e.temp, max);
        return { x: e.left + 20, y: e.top + 20, value: e.temp * e.opacity, radius: e.radius };
      });
    heatmapRef.current.setData({ max, data: points });
    fabricRef.current?.renderAll();
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
        const json = canvas.toJSON(["hasControls", "name", "temp", "selectable", "type", "id", "radius"]);
        window.localStorage.setItem("json", JSON.stringify(json));
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
        canvas.loadFromJSON(JSON.parse(json), () => {
          if (!mainCanvasRef.current) {
            return;
          }

          setItems(initialItems);
          initHeatmap(mainCanvasRef.current?.clientWidth, mainCanvasRef.current?.clientHeight);
          // update the items state according to the imported json
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
  const [items, setItems] = useState<any[]>(initialItems);
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
        const dataArray = e.data.filter((e: any) => {
          const date = new Date(e.ts);
          return date >= selectedDates[0] && date <= selectedDates[1];
        });
        const newTemp = getAvg(dataArray);
        updateTemp(fabricRef.current, newTemp, e.id);
      });
    calculateHeatMap();
    // setTimeout(() => {
    //   calculateHeatMap();
    // }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDates]);

  const mainCanvasRef = useRef<HTMLDivElement>(null);
  const [currentPin, setCurrentPin] = useState(null);
  const setPinRef = useRef(setCurrentPin);
  // const navigate = useNavigate();
  return (
    <>
      <div className="navbar">
        {/* {mode === "edit" ? (
          <Button
            onClick={() => {
              navigate("/view");
            }}
          >
            View
          </Button>
        ) : (
          <Button
            onClick={() => {
              navigate("/");
            }}
          >
            Edit
          </Button>
        )} */}
        {mode === "edit" && <input type="file" className="file-input" onChange={handleInput} />}
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
                          handleDelete(parseInt(e.id), fabricRef.current);
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
          {currentPin && <PinDetails currentPinId={currentPin} items={items} dateRange={selectedDates} />}
          {/* {currentPin && <PinDetails currentPinId={currentPin} items={items} dateRange={selectedDates} />} */}
        </div>
      </div>
    </>
  );
}
