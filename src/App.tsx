import "./App.css";
import Canvas from "./components/Canvas";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ViewCanvas from "./components/ViewCanvas";

function App() {
  const router = createBrowserRouter([
    { path: "/", element: <Canvas /> },
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
