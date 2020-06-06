import React, { useEffect, useRef } from "react";

import * as tf from "@tensorflow/tfjs-core";
import * as dat from "dat.gui";
import * as Stats from "stats.js";
import { ScatterGL } from "scatter-gl";
import * as handpose from "@tensorflow-models/handpose";
import * as tfjsWasm from "@tensorflow/tfjs-backend-wasm";
import { version_wasm } from "@tensorflow/tfjs-backend-wasm";

import "@tensorflow/tfjs-backend-webgl";

tfjsWasm.setWasmPath(
  `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${version_wasm}/dist/tfjs-backend-wasm.wasm`
);

let videoWidth,
  videoHeight,
  scatterGLHasInitialized = false,
  scatterGL,
  fingerLookupIndices = {
    thumb: [0, 1, 2, 3, 4],
    indexFinger: [0, 5, 6, 7, 8],
    middleFinger: [0, 9, 10, 11, 12],
    ringFinger: [0, 13, 14, 15, 16],
    pinky: [0, 17, 18, 19, 20],
  }; // for rendering each finger as a polyline

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 500;

const state = {
  backend: "webgl",
  renderPointcloud: true,
};

function setupDatGui() {
  const gui = new dat.GUI();
  gui
    .add(state, "backend", ["wasm", "webgl", "cpu", "webgpu"])
    .onChange(async (backend) => {
      await tf.setBackend(backend);
    });

  gui.add(state, "renderPointcloud").onChange((render) => {
    document.querySelector("#scatter-gl-container").style.display = render
      ? "inline-block"
      : "none";
  });
}

function drawPoint(ctx, y, x, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fill();
}

function drawKeypoints(ctx, keypoints) {
  const keypointsArray = keypoints;

  for (let i = 0; i < keypointsArray.length; i++) {
    const y = keypointsArray[i][0];
    const x = keypointsArray[i][1];
    drawPoint(ctx, x - 2, y - 2, 3);
  }

  const fingers = Object.keys(fingerLookupIndices);
  for (let i = 0; i < fingers.length; i++) {
    const finger = fingers[i];
    const points = fingerLookupIndices[finger].map((idx) => keypoints[idx]);
    drawPath(ctx, points, false);
  }
}

function drawPath(ctx, points, closePath) {
  const region = new Path2D();
  region.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    region.lineTo(point[0], point[1]);
  }

  if (closePath) {
    region.closePath();
  }
  ctx.stroke(region);
}

let model;

const landmarksRealTime = async (video) => {
  // setupDatGui();

  // const stats = new Stats();
  // stats.showPanel(0);
  // document.body.appendChild(stats.dom);

  const canvas = document.getElementById("output");
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, videoWidth, videoHeight);
  ctx.strokeStyle = "red";
  ctx.fillStyle = "red";

  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);

  // These anchor points allow the hand pointcloud to resize according to its
  // position in the input.
  const ANCHOR_POINTS = [
    [0, 0, 0],
    [0, -VIDEO_HEIGHT, 0],
    [-VIDEO_WIDTH, 0, 0],
    [-VIDEO_WIDTH, -VIDEO_HEIGHT, 0],
  ];

  async function frameLandmarks() {
    // stats.begin();
    ctx.drawImage(
      video,
      0,
      0,
      videoWidth,
      videoHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );
    console.log('video', video)
    const predictions = await model.estimateHands(video);
    // if (predictions.length > 0) {
    //   const result = predictions[0].landmarks;
    //   drawKeypoints(ctx, result, predictions[0].annotations);

    //   if (scatterGL != null) {
    //     const pointsData = result.map((point) => {
    //       return [-point[0], -point[1], -point[2]];
    //     });

    //     const dataset = new ScatterGL.Dataset([
    //       ...pointsData,
    //       ...ANCHOR_POINTS,
    //     ]);

    //     if (!scatterGLHasInitialized) {
    //       scatterGL.render(dataset);

    //       const fingers = Object.keys(fingerLookupIndices);

    //       scatterGL.setSequences(
    //         fingers.map((finger) => ({ indices: fingerLookupIndices[finger] }))
    //       );
    //       scatterGL.setPointColorer((index) => {
    //         if (index < pointsData.length) {
    //           return "steelblue";
    //         }
    //         return "white"; // Hide.
    //       });
    //     } else {
    //       scatterGL.updateDataset(dataset);
    //     }
    //     scatterGLHasInitialized = true;
    //   }
    // }
    // stats.end();
    await tf.nextFrame();
    // requestAnimationFrame(frameLandmarks);
  }

  frameLandmarks();

  // document.querySelector(
  //   "#scatter-gl-container"
  // ).style = `width: ${VIDEO_WIDTH}px; height: ${VIDEO_HEIGHT}px;`;

  // scatterGL = new ScatterGL(document.querySelector("#scatter-gl-container"), {
  //   rotateOnStart: false,
  //   selectEnabled: false,
  // });
};

const startStream = (ref) => {
  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => (ref.current.srcObject = stream));
  }
};

const Hand = () => {
  const cameraRef = useRef();

  const start = async () => {
    const camera = cameraRef.current;
    if (camera && camera.readyState === 4) {
      console.log("video is ready for processing..");
      await tf.ready();
      model = await handpose.load();
      landmarksRealTime(camera);
    } else {
      console.log("nope, not ready yet..");
      setTimeout(start, 1000 / 30);
    }
  };

  useEffect(() => {
    startStream(cameraRef);
    start();
  });

  return (
    <>
      <div id="info" style={{ display: "none" }}></div>
      <div id="predictions"></div>
      <div id="canvas-wrapper">
      <canvas width="640" height="480" id="output" />
        <video id="video" width="640" height="480" autoPlay muted ref={cameraRef} />
      </div>
      <div id="scatter-gl-container"></div>
    </>
  );
};

export default Hand;
