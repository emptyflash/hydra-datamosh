// Reverse Datamosh with WebCodecs.
// Author: Amagi
//
// Unlike normal Datamosh, this applies the delta frame over and over, resulting adn over-animated frames.

export default async function datamoshSource(source, dest, params) {
  params = params || {
    speed: 2,
  };
  let canvas = document.getElementById("datamoshCanvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
  }
  await dest.init({ src: canvas })
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

  // Start the processing loop
  function processFrame() {
    if (source.src) {
      const width = source.src.videoWidth || source.src.width
      const height = source.src.videoHeight || source.src.videoHeight
      if (width > 0 && height > 0) {
        if (encoder.state === 'unconfigured') {
          encoder.configure({
            codec: "vp8",
            width,
            height,
            bitrate: 1_000_000, // 1Mbps bitrate
          });
        }
        // Video is playing
        const frame = new VideoFrame(source.src, {
          timestamp: performance.now() * 1000,
        });
        encoder.encode(frame, { keyFrame: params.keyFrame });
        params.keyFrame = false;
        frame.close();
      }
    }
    requestAnimationFrame(processFrame);
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
    if (source.src.width) {
      canvas.width = source.src.width
    }
    if (source.src.height) {
      canvas.height = source.src.height
    }
    // Draw the decoded frame onto the canvas
    ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
    frame.close();
  }

  processFrame(); // Start encoding and decoding
}
