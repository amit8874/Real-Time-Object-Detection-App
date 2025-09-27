import Webcam from "react-webcam";
import "./App.css";
import { useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [lastAlert, setLastAlert] = useState(0); 

  useEffect(() => {
    startPrediction();
  }, []);

  const startPrediction = async () => {
    const model = await cocoSsd.load();
    setLoading(false);
    console.log("Model Loaded ✅");

    setInterval(() => {
      detect(model);
    }, 200); 
  };

  const detect = async (model) => {
    if (
      webcamRef.current &&
      webcamRef.current.video &&
      webcamRef.current.video.readyState === 4
    ) {
      const video = webcamRef.current.video;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const predictions = await model.detect(video);

      const ctx = canvasRef.current.getContext("2d");
      drawMesh(predictions, ctx);
      handleDetectionMap(predictions);
    }
  };

  const drawMesh = (predictions, ctx) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    predictions.forEach((prediction) => {
      const [x, y, width, height] = prediction.bbox;
      const text = `${prediction.class} (${Math.round(
        prediction.score * 100
      )}%)`;

      ctx.strokeStyle = "green";
      ctx.lineWidth = 2;
      ctx.font = "18px Arial";
      ctx.fillStyle = "green";

      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.stroke();
      ctx.fillText(text, x, y > 10 ? y - 5 : 10);
    });
  };

  const handleDetectionMap = (predictions) => {
    const map = {};
    predictions.forEach((p) => {
      map[p.class] = (map[p.class] || 0) + 1;
    });

    const now = Date.now();
    if (now - lastAlert > 3000) { 
      if (map["person"] > 1) {
        alert("⚠️ Multiple persons detected!");
        setLastAlert(now);
      } else if (map["cell phone"]) {
        alert("📱 Cell phone detected!");
        setLastAlert(now);
      }
    }
  };

  return (
    <div className="parentContainer">
      <h1 className="appTitle">Real-Time Object Detection</h1>
      {loading ? <span>Loading Model ...</span> : ""}
      <div className="videoWrapper" style={{ position: "relative" }}>
        <Webcam
          ref={webcamRef}
          style={{ position: "absolute", top: 0, left: 0 }}
        />
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", top: 0, left: 0 }}
        />
      </div>
    </div>
  );
}

export default App;
