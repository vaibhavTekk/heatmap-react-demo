/* eslint-disable @typescript-eslint/no-explicit-any */
import { useToast } from "@chakra-ui/react";
import { fabric } from "fabric";
import { useRef, useEffect, useState } from "react";
import { getAvg } from "../utils/tempHandler";
import { createPin, updateTemp } from "../utils/objectHandlers";
import h337, { HeatmapConfiguration } from "heatmap.js";
import { calculateHeatMap } from "../utils/heatmapHandler";
import { produce } from "immer";

function useCanvas(
  mainCanvasRef: React.RefObject<HTMLDivElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  data: any,
  mode: string
) {
  const [loaded, setLoaded] = useState(false);

  const toast = useToast();
  const toastRef = useRef(toast);

  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const [items, setItems] = useState<any[]>([]);
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const [radius, setRadius] = useState<number>(100);
  const radiusRef = useRef(radius);
  useEffect(() => {
    radiusRef.current = radius;

    if (!fabricRef.current || !heatmapRef.current || !loaded) return;
    calculateHeatMap(fabricRef.current, heatmapRef.current, radius);
  }, [radius, loaded]);

  const heatmapRef = useRef<any>(null);
  const heatmapCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const calculateHeatMapRef = useRef(calculateHeatMap);

  const [currentPin, setCurrentPin] = useState(null);
  const setPinRef = useRef(setCurrentPin);

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

  const fabricRef = useRef<fabric.Canvas | null>(null);
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
        if (!fabricRef.current) {
          return;
        }
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
      .on("object:moving", (e) => {
        if (!fabricRef.current) {
          return;
        }
        calculateHeatMapRef.current(fabricRef.current, heatmapRef.current, radiusRef.current);
      })
      .on("object:modified", (e) => {
        if (!fabricRef.current) {
          return;
        }
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
        if (!fabricRef.current) {
          return;
        }
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
        if (!fabricRef.current) {
          return;
        }
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
        if (!fabricRef.current) {
          return;
        }
        const evt = opt.e;
        if (evt.altKey === true) {
          fabricRef.current.isDragging = true;
          fabricRef.current.selection = false;
          fabricRef.current.lastPosX = evt.clientX;
          fabricRef.current.lastPosY = evt.clientY;
        }
      })
      .on("mouse:move", function (opt) {
        if (!fabricRef.current) {
          return;
        }
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
      .on("mouse:up", function (opt) {
        if (!fabricRef.current) {
          return;
        }
        // on mouse up we want to recalculate new interaction
        // for all objects, so we call setViewportTransform
        fabricRef.current.setViewportTransform(fabricRef.current.viewportTransform);
        fabricRef.current.isDragging = false;
        fabricRef.current.selection = true;
      })
      .on("mouse:wheel", function (opt) {
        if (!fabricRef.current) {
          return;
        }
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

          initHeatmap(mainCanvasRef.current?.clientWidth, mainCanvasRef.current?.clientHeight);
          // update the items state according to the imported json
          setTimeout(() => {
            const objects = canvas.getObjects();
            const planObject = objects.filter((e) => e.name === "plan")[0];
            if (planObject) {
              planObject.sendToBack();
            }
            objects
              .filter((e) => e.name == "pin")
              .forEach((e) => {
                removeFromList(e.id);
              });
            setLoaded(true);
            resolve();
          }, 1000);
          calculateHeatMap(canvas, heatmapRef.current, radius);
        });
      } catch (error) {
        reject(error);
      }
    });
  };

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

  const convertToImage = (canvas: fabric.Canvas | null) => {
    if (!canvas) {
      throw new Error("Canvas not Loaded");
    }
    return canvas.toDataURL() as string;
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
        success: { title: "Success!", description: "Loaded from Local Storage" },
        error: { title: "Failed!", description: "Something wrong" },
        loading: { title: "Loading...", description: "Please wait" },
      });
      setTimeout(() => {
        setLoaded(false);
        if (!fabricRef.current) {
          return;
        }
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

  // change the pin details and heatmap based on the date range
  useEffect(() => {
    items
      .filter((e) => e.used === true)
      .forEach((e) => {
        const dataArray = data.data[e.name];
        const newTemp = getAvg(dataArray);
        updateTemp(fabricRef.current, newTemp, e.id);
      });
    calculateHeatMap(fabricRef.current, heatmapRef.current, radius);
  }, [data]);

  return {
    fabricRef,
    heatmapRef,
    initFabric,
    items,
    setItems,
    loaded,
    setLoaded,
    radius,
    setRadius,
    LoadFromLocalStorage,
    currentPin,
    setCurrentPin,
    handleDelete,
    saveToLocalStorage,
    convertToImage,
    calculateHeatMap,
  };
}

export default useCanvas;
