import React, { useEffect, useRef } from 'react'
// import { handpose } from '@tensorflow-models/handpose';
import '@tensorflow/tfjs-backend-webgl';

const tf = require('@tensorflow/tfjs-core');
const handpose = require('@tensorflow-models/handpose');

const startStram = ref => {
  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => ref.current.srcObject = stream);
  }
}

const HandDectect = () => {
  const cameraRef = useRef();
  const canvasRef = useRef();
  const movieRef = useRef();

  const loadModel = async () => {
    const canvas = canvasRef.current;
		const draw = canvas.getContext("2d");
    const model = await handpose.load();

    while(1)
				{
					// copy camera stream to canvas
					draw.drawImage(cameraRef.current, 0, 0, 640, 480);

					// track hand position
          const result = await model.estimateHands(cameraRef.current);
          console.log('results', result);

          // size of media player
          const w = 250;
          const h = 150;
          // default position : top right corner
          let index_x = canvas.width - w - 10;
          let index_y = 10;

					// check if hand is detected
					if(result.length > 0)
					{
						// get hand co-ordinates
            const hand = result[0];
            console.log('hand', hand);

						// update index finger tip position
						const index = hand.annotations.indexFinger;

						index_x = Math.round(index[3][0]);
						index_y = Math.round(index[3][1]);
					}

					// // display media player at assigned location
					draw.drawImage(movieRef.current, index_x, index_y, w, h);

					// // loop to process the next frame
					await tf.nextFrame();
				}

    console.log('moedl------', model)
  }

  const main = () => {
    const camera = cameraRef.current
    if(camera && camera.readyState == 4) {
      console.log("video is ready for processing..");
      loadModel();
    }
    else {
      console.log("nope, not ready yet..");
      setTimeout(main, 1000/30);
    }
  }

  useEffect(() => {
    startStram(cameraRef);
    main()
  })

  return (
    <>
      <video
        width="640"
        height="480"
        autoPlay
        muted
        ref={cameraRef} />
        <canvas width="640" height="480" ref={canvasRef} />
        <video autoPlay muted loop ref={movieRef} style={{ visibility: "hidden" }} />
    </>
  )
}

export default HandDectect;
