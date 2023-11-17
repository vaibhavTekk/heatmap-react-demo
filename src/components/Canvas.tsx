/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
import "./canvas.css";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { format } from "date-fns";

import { useToast } from "@chakra-ui/react";
import { RangeDatepicker } from "chakra-dayzed-datepicker";

import { useGetSensorsQuery } from "../services/api";

import useCanvas from "../hooks/useCanvas";
import StrokeWidthSlider from "./StrokeWidthSlider";
import PanButtons from "./PanButtons";
import RadiusSlider from "../components/RadiusSlider";
import ZoomSlider from "./ZoomSlider";
import PinDetails from "./PinDetails";
import SaveButtons from "./SaveButtons";
import ItemsBox from "./ItemsBox";

import { getPDFImageObject } from "../utils/pdfHandler";
import { addDxfToCanvas } from "../utils/dxfHandler";

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
    LoadFromLocalStorage,
    currentPin,
    handleDelete,
    saveToLocalStorage,
    convertToImage,
    calculateHeatMap,
    handleInput,
    fileType,
  } = useCanvas(mainCanvasRef, canvasRef, data, mode);

  useEffect(() => {
    if (error) {
      toast({ status: "error", title: "Error fetching Sensor data", description: error.message });
      console.log(error);
    }
    if (data && data.data) {
      toast({ status: "success", title: "Sensor Data Loaded!" });
      if (items.length < 1) {
        const itemsArray = Object.entries(data.data).map((e, i) => {
          const oldItems = fabricRef.current?.getObjects();
          console.log(oldItems.filter((e) => e.id === e[0]));
          return {
            id: e[0],
            name: e[0],
            // if the array already exists and the item is marked true or false then that needs to be copied over
            // used: oldItems[0] ? true : false,
            used: false,
          };
        });
        setItems(itemsArray);
      }
      calculateHeatMap(fabricRef.current, heatmapRef.current, radius);
    }
  }, [data, loading, error, toast]);

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
          <SaveButtons
            canvas={fabricRef.current}
            mode={mode}
            LoadFromLocalStorage={LoadFromLocalStorage}
            saveToLocalStorage={saveToLocalStorage}
            convertToImage={convertToImage}
            loaded={loaded}
          />
          {loaded && mode === "edit" ? (
            <ItemsBox canvas={fabricRef.current} items={items} handleDelete={handleDelete} />
          ) : mode === "edit" ? (
            <div>Please load a floor plan</div>
          ) : null}
          {currentPin && <PinDetails currentPinId={currentPin} data={data} items={items} dateRange={selectedDates} />}
        </div>
      </div>
    </>
  );
}
