// Adapted from codepen by Amagi: https://codepen.io/fand/pen/Vwojwqm

export async function datamosh(source, params) {
	params = params || {
		speed: 2,
	};
	const hydra = params.hydra || window.hydraSynth;
	let output;
	if (typeof source === 'function') {
		if (!window.newHydra) {
			const newHydra = new Hydra({
				makeGlobal: false
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
	if (!canvas) {
		canvas = document.createElement("canvas");
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

	// Start the processing loop
	function processFrame() {
		if (source.src) {
			const width = source.src.videoWidth || source.src.width
			const height = source.src.videoHeight || source.src.height
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
					timestamp: performance.now() * 1000,
				});
				encoder.encode(frame, {
					keyFrame: params.keyFrame
				});
				params.keyFrame = false;
				frame.close();
			}
		}
		window.datamoshRequest = requestAnimationFrame(processFrame);
	}

	function handleEncodedChunk(chunk) {
		if (chunk.type === "key") {
			window.decoder.decode(chunk);
		} else {
			for (let i = 0; i < params.speed; i++) {
				window.decoder.decode(chunk);
			}
		}
	}

	function handleDecodedFrame(frame) {
		// Draw the decoded frame onto the canvas
		ctx.drawImage(frame, 0, 0);
		frame.close();
	}

	if (window.datamoshRequest) {
		cancelAnimationFrame(window.datamoshRequest)
	}
	processFrame(); // Start encoding and decoding
	return newSource;
}
