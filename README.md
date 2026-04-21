# hydra-datamosh

Plugin for hydra that applies a datamosh effect to sources and outputs using WebCodecs.

## Usage

You can datamosh two ways, by datamoshing an input source like a video, or by datamoshing a hydra output.

### Video Source

```javascript
const { datamosh } = await import("https://emptyfla.sh/hydra-datamosh/datamosh.js")
await s0.initVideo('https://content.jwplatform.com/videos/N4X1NkIR-1hon4Bsu.mp4')
const newSource = await datamosh(s0)
src(newSource).out()
```

### Hydra Output

The input to the datamosh function for this is a function that take a hydra synth instance as a parameter. You should use this hydra synth instance instead of the main one as this is what will be datamoshed.

```javascript
const { datamosh } = await import("https://emptyfla.sh/hydra-datamosh/datamosh.js")
const newSource = await datamosh((h) => h.osc().out())
src(newSource).out()
```

## Additional info

The second parameter to the `datamosh` function accepts an object with options such as `speed` which is essentially the "amount" of datamoshing, and `keyFrame` which is a boolean that can be used to reset the feedback.

You can also use window and alt-enter or option-enter in the hydra editor to update options on the fly like this:

```javascript
const { datamosh } = await import("https://emptyfla.sh/hydra-datamosh/datamosh.js")

await s0.initVideo('https://content.jwplatform.com/videos/N4X1NkIR-1hon4Bsu.mp4')

window.params = window.params || {speed:3}

window.params.keyFrame = true

const newVideoSource = await datamosh(s0, window.params)
src(newVideoSource).out()
```
 
In this case if you hit alt-enter on the line `window.params.keyFrame = true` it will reset the datamosh feedback without restarting the video.
