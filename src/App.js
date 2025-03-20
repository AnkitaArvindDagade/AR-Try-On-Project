import React, { useState, useRef, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as posenet from "@tensorflow-models/posenet";

function App() {
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    setCameraActive(true);
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 850, facingMode: "user" },
    });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  useEffect(() => {
    if (!cameraActive) return;

    const loadPoseNet = async () => {
      const net = await posenet.load();
      detectPose(net);
    };

    const detectPose = async (net) => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        requestAnimationFrame(() => detectPose(net));
        return;
      }

      const pose = await net.estimateSinglePose(videoRef.current, {
        flipHorizontal: true,
        decodingMethod: "single-person",
      });

      drawTShirtOverlay(pose);
      requestAnimationFrame(() => detectPose(net));
    };

    const drawTShirtOverlay = (pose) => {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      if (!pose || !pose.keypoints) return;

      const leftShoulder = pose.keypoints[5].position;
      const rightShoulder = pose.keypoints[6].position;
      const leftHip = pose.keypoints[11].position;
      const rightHip = pose.keypoints[12].position;

      // ✅ Adjusted calculations for better fit
      const shirtWidth = Math.abs(rightShoulder.x - leftShoulder.x) * 2;
      const shirtHeight = Math.abs(leftHip.y - leftShoulder.y) * 1.3; // Increased height to fit torso
      const shirtX = leftShoulder.x - shirtWidth / 2;
      const shirtY = leftShoulder.y - (shirtHeight * 0.1); // ✅ Lowered to fit body

      const img = new Image();
      img.src = "/tshirt.png";  
      img.onload = () => {
        ctx.drawImage(img, shirtX, shirtY, shirtWidth, shirtHeight);
      };
    };

    loadPoseNet();
  }, [cameraActive]);

  return (
    <div className="container">
      <h1>Try It On</h1>
      <img src="/tshirt.png" alt="T-shirt" className="tshirt-image" />
      <br />
      <button onClick={startCamera} className="try-on-btn">Try It On</button>
      {cameraActive && (
        <div className="camera-container">
          <div style={{ position: "relative", width: "640px", height: "850px" }}> 
            <video
              ref={videoRef}
              width="640"
              height="850"
              autoPlay
              muted
              style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }}
            />
            <canvas
              ref={canvasRef}
              width="640"
              height="850"
              style={{ position: "absolute", top: 0, left: 0, zIndex: 2 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;