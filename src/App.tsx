import "./App.css";
import Canvas from "./components/Canvas";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ViewCanvas from "./components/ViewCanvas";
import Canvas2 from "./components/Canvas2";

function App() {
  const router = createBrowserRouter([
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
