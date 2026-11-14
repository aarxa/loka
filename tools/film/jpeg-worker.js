// Encodes frames to JPEG off the page's main thread: receives {id, w, h, px (ArrayBuffer of RGBA)}, replies {id, blob}.
let oc = null, g = null;
onmessage = async e => {
  const { id, w, h, px, q, type } = e.data;
  if (!oc || oc.width !== w || oc.height !== h) { oc = new OffscreenCanvas(w, h); g = oc.getContext('2d'); }
  g.putImageData(new ImageData(new Uint8ClampedArray(px), w, h), 0, 0);
  const t = performance.now();
  const blob = await oc.convertToBlob(type === 'png' ? { type: 'image/png' } : { type: 'image/jpeg', quality: q ?? .97 });
  postMessage({ id, blob, ms: performance.now() - t });
};
