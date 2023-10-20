import "./App.css";
import Canvas from "./components/Canvas";
import Navbar from "./components/Navbar";

function App() {
  return (
    <>
      <div className="main-container">
        <Navbar />
        <Canvas />
      </div>
    </>
  );
}

export default App;
