import "./App.css";
import Canvas from "./components/Canvas";
import { RouterProvider, createHashRouter } from "react-router-dom";
import ViewCanvas from "./components/ViewCanvas";

function App() {
  const router = createHashRouter([
    { path: "/", element: <Canvas mode={"edit"} /> },
    { path: "/view", element: <ViewCanvas /> },
  ]);

  return (
    <>
      <div className="main-container">
        <RouterProvider router={router} />
      </div>
    </>
  );
}

export default App;
