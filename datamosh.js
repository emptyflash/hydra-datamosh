// Adapted from codepen by Amagi: https://codepen.io/fand/pen/Vwojwqm

window.datamoshedSources = {}

function getKey(item) {
  if (typeof item === 'function') {
    return item.toString();
  }
  return item;
}

export async function datamosh(inputSource, params) {
  const existingSource = window.datamoshedSources[getKey(inputSource)];
  if (!existingSource) {
    let source = inputSource;
    params = params || {
      speed: 2,
    };
    const hydra = params.hydra || window.hydraSynth;
    if (typeof source === 'function') {
      if (!window.newHydra) {
        const newHydra = new Hydra({
          makeGlobal: false,
          autoLoop: false,
        });
        window.newHydra = newHydra;
      }
      const datamoshSource = newHydra.createSource(newHydra.s.length);
      source(newHydra.synth)
      await datamoshSource.init({
        src: newHydra.canvas
      });
      source = datamoshSource;
    }
    const newSource = hydra.createSource(hydra.s.length);
    let canvas = document.getElementById("datamoshCanvas");
    const width = source.src.videoWidth || source.src.width
    const height = source.src.videoHeight || source.src.height
    if (!canvas) {
      canvas = new OffscreenCanvas(width, height);
    }
    await newSource.init({
      src: canvas
    })
    const ctx = canvas.getContext("2d");
    const encoder = new VideoEncoder({
      output: handleEncodedChunk,
      error: (err) => console.error("Encoder error:", err),
    });

    const decoder = new VideoDecoder({
      output: handleDecodedFrame,
      error: (err) => console.error("Decoder error:", err),
    });
    decoder.configure({
      codec: "vp8",
    });

    let lastFrame = performance.now()
    const fps = 60;
    const fpsInterval = 1000 / fps;
    // Start the processing loop
    function processFrame() {
      requestAnimationFrame(processFrame);

      const now = performance.now();
      const dt = now - lastFrame;

      if (dt > fpsInterval) {
        if (window.newHydra) {
          window.newHydra.tick(dt);
        }
        if (source.src) {
          if (width > 0 && height > 0) {
            if (encoder.state === 'unconfigured') {
              canvas.width = width;
              canvas.height = height;
              encoder.configure({
                codec: "vp8",
                width,
                height,
                bitrate: 1_000_000, // 1Mbps bitrate
              });
            }
            // Video is playing
            const frame = new VideoFrame(source.src, {
              timestamp: now * 1000,
            });
            encoder.encode(frame, {
              keyFrame: params.keyFrame
            });
            params.keyFrame = false;
            frame.close();
          }
        }
      }
      lastFrame = now;
    }

    function handleEncodedChunk(chunk) {
      if (chunk.type === "key") {
        decoder.decode(chunk);
      } else {
        for (let i = 0; i < params.speed; i++) {
          decoder.decode(chunk);
        }
      }
    }

    function handleDecodedFrame(frame) {
      // Draw the decoded frame onto the canvas
      ctx.drawImage(frame, 0, 0);
      frame.close();
    }

    processFrame(); // Start encoding and decoding
    window.datamoshedSources[getKey(inputSource)] = newSource;
    return newSource;
  } else {
    return existingSource;
  }
}
