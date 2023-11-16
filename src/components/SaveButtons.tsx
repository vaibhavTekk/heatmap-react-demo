/* eslint-disable @typescript-eslint/no-explicit-any */
import { Icon, useToast } from "@chakra-ui/react";
import { useState } from "react";
import { HiDownload, HiFolderOpen, HiOutlineSave } from "react-icons/hi";

export default function SaveButtons({
  canvas,
  mode,
  LoadFromLocalStorage,
  saveToLocalStorage,
  convertToImage,
  loaded,
}: {
  canvas: fabric.Canvas;
  mode: string;
  LoadFromLocalStorage: any;
  saveToLocalStorage: any;
  convertToImage: any;
  loaded: boolean;
}) {
  const toast = useToast();

  const [url, setUrl] = useState("");
  return (
    <div className="save-buttons">
      {mode === "edit" && (
        <Icon
          as={HiFolderOpen}
          boxSize={6}
          style={{ margin: "10px", cursor: "pointer" }}
          onClick={async () => {
            const promise = LoadFromLocalStorage(canvas);
            toast.promise(promise, {
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
              const promise = saveToLocalStorage(canvas);
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
              const imgurl = convertToImage(canvas);
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
  );
}
