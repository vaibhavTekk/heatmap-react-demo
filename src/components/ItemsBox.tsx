/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tooltip } from "@chakra-ui/react";
import { HiOutlineStatusOnline, HiTrash } from "react-icons/hi";

export default function ItemsBox({
  canvas,
  items,
  handleDelete,
}: {
  canvas: fabric.Canvas | null;
  items: any[];
  handleDelete: any;
}) {
  return (
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
                handleDelete(e.id, canvas);
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
  );
}
