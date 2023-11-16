/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useToast } from "@chakra-ui/react";
import { RangeDatepicker } from "chakra-dayzed-datepicker";

import { HiOutlineStatusOnline, HiOutlineSave, HiFolderOpen, HiDownload, HiTrash } from "react-icons/hi";
import PanButtons from "./PanButtons";
// import { initialData } from "../utils/samplePinData";
import RadiusSlider from "../components/RadiusSlider";
// import { RangeDatepicker } from "chakra-dayzed-datepicker";
import "./canvas.css";
import ZoomSlider from "./ZoomSlider";
import { Icon, Tooltip } from "@chakra-ui/react";
import PinDetails from "./PinDetails";
import { getPDFImageObject } from "../utils/pdfHandler";
import { addDxfToCanvas } from "../utils/dxfHandler";
import StrokeWidthSlider from "./StrokeWidthSlider";
import { format } from "date-fns";
import { useGetSensorsQuery } from "../services/api";
import useCanvas from "../hooks/useCanvas";
// import { useNavigate } from "react-router-dom";

export default function Canvas({ mode }: { mode: string }) {
  const toast = useToast();

  const canvasRef = useRef(null);

  const mainCanvasRef = useRef<HTMLDivElement>(null);
  // const initialDates = [new Date("2023-10-10"), new Date("2023-11-09")];

  const [selectedDates, setSelectedDates] = useState<Date[]>([new Date("2023-10-10"), new Date("2023-11-09")]);

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

  const {
    fabricRef,
    heatmapRef,
    radius,
    setRadius,
    items,
    setItems,
    loaded,
    setLoaded,
    LoadFromLocalStorage,
    currentPin,
    handleDelete,
    saveToLocalStorage,
    convertToImage,
    calculateHeatMap,
  } = useCanvas(mainCanvasRef, canvasRef, data, mode);

  useEffect(() => {
    console.log("SelectedDates:", selectedDates);
  }, [selectedDates]);

  useEffect(() => {
    if (error) {
      toast({ status: "error", title: "Error fetching Sensor data", description: error.message });
      console.log(error);
    }
    if (data && data.data) {
      toast({ status: "success", title: "Sensor Data Loaded!" });
      console.log(data);
      const itemsArray = Object.entries(data.data).map((e, i) => {
        const oldItem = fabricRef.current?.getObjects().filter((e) => e.name === e[0])[0];
        return {
          id: e[0],
          name: e[0],
          // if the array already exists and the item is marked true or false then that needs to be copied over
          used: oldItem ? true : false,
        };
      });
      setItems(itemsArray);
      calculateHeatMap(fabricRef.current, heatmapRef.current, radius);
    }
  }, [data, loading, error, toast]);

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

  return (
    <>
      <div className="navbar">
        {mode === "edit" && <input type="file" className="file-input" onChange={handleInput} />}
      </div>
      <div className="container">
        <div className="main-canvas-container" ref={mainCanvasRef}>
          {/*this is created functionally ->  <div className="heatmap"></div> */}
          <div className="internal-canvas-container">
            <canvas className="canvas" ref={canvasRef}></canvas>
          </div>
        </div>
        <div className="toolbox-container">
          {mode === "edit" && fileType === "dxf" ? <StrokeWidthSlider canvas={fabricRef.current} /> : null}
          <ZoomSlider canvas={fabricRef.current} />
          {loaded && <RadiusSlider radius={radius} setRadius={setRadius} />}
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
