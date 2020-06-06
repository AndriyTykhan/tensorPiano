import React, { useEffect, useRef } from "react";
import * as tf from "@tensorflow/tfjs-core";
import * as Stats from "stats.js";
import * as handpose from "@tensorflow-models/handpose";

import "@tensorflow/tfjs-backend-webgl";

import { setupDatGui, drawKeypoints } from "../utils/index";

const startStram = (ref) => {
  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => (ref.current.srcObject = stream));
  }
};

const HandDectect = () => {
  const cameraRef = useRef();
  const canvasRef = useRef();
  const movieRef = useRef();

  const loadModel = async () => {
    const stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const model = await handpose.load();

    while (1) {
      stats.begin();
      // copy camera stream to canvas
      ctx.drawImage(cameraRef.current, 0, 0, 640, 480);

      // track hand position
      const predictions = await model.estimateHands(cameraRef.current);

      if (predictions.length > 0) {
        const result = predictions[0].landmarks;
        const annotations = predictions[0].annotations;


        let pos = annotations.indexFinger[0][0].toFixed(0);

        console.log('0--------------------------', pos)

        if (annotations.indexFinger[0][0].toFixed(0) !== pos) {
          // console.log('0--------------------------',annotations?.indexFinger[0])
        }
        
        
        drawKeypoints(ctx, result, annotations);
      }
      stats.end();
      await tf.nextFrame();
    }
  };

  const main = () => {
    const camera = cameraRef.current;
    if (camera && camera.readyState === 4) {
      console.log("video is ready for processing..");
      loadModel();
    } else {
      console.log("nope, not ready yet..");
      setTimeout(main, 1000 / 30);
    }
  };

  useEffect(() => {
    startStram(cameraRef);
    main();
  });

  return (
    <>
      <div id="info" style={{ display: "none" }}></div>
      <video width="640" height="480" autoPlay muted ref={cameraRef} />
      <canvas width="640" height="480" ref={canvasRef} />
      <video
        autoPlay
        muted
        loop
        ref={movieRef}
        style={{ visibility: "hidden" }}
      />
    </>
  );
};

export default HandDectect;
