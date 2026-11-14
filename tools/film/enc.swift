// Reads image frames from stdin (each: 4-byte little-endian length, then a JPEG or PNG) and writes them to one or more
// video files at once, each scaled to its own size.
// usage: enc W H FPS out1.mp4,w,h,codec,bitrate [out2...]      codec: h264 | hevc
import Foundation
import AVFoundation
import CoreGraphics
import ImageIO
import VideoToolbox

let a = CommandLine.arguments
let FPS = Int32(a[3])!
struct Out { let w: AVAssetWriter; let i: AVAssetWriterInputPixelBufferAdaptor; let W: Int; let H: Int }
var outs: [Out] = []
for spec in a[4...] {
  let f = spec.split(separator: ","); let url = URL(fileURLWithPath: String(f[0]))
  let ow = Int(f[1])!, oh = Int(f[2])!, codec = String(f[3]), br = Int(f[4])!
  try? FileManager.default.removeItem(at: url)
  let w = try! AVAssetWriter(outputURL: url, fileType: url.pathExtension == "mov" ? .mov : .mp4)
  var comp: [String: Any] = [AVVideoAverageBitRateKey: br, AVVideoExpectedSourceFrameRateKey: FPS, AVVideoMaxKeyFrameIntervalKey: FPS,
                             AVVideoAllowFrameReorderingKey: true]
  if codec == "h264" { comp[AVVideoProfileLevelKey] = AVVideoProfileLevelH264HighAutoLevel; comp[AVVideoH264EntropyModeKey] = AVVideoH264EntropyModeCABAC }
  else { comp[AVVideoProfileLevelKey] = kVTProfileLevel_HEVC_Main_AutoLevel as String }
  let settings: [String: Any] = [AVVideoCodecKey: codec == "hevc" ? AVVideoCodecType.hevc : AVVideoCodecType.h264,
    AVVideoWidthKey: ow, AVVideoHeightKey: oh, AVVideoCompressionPropertiesKey: comp,
    AVVideoColorPropertiesKey: [AVVideoColorPrimariesKey: AVVideoColorPrimaries_ITU_R_709_2,
      AVVideoTransferFunctionKey: AVVideoTransferFunction_ITU_R_709_2, AVVideoYCbCrMatrixKey: AVVideoYCbCrMatrix_ITU_R_709_2]]
  let inp = AVAssetWriterInput(mediaType: .video, outputSettings: settings); inp.expectsMediaDataInRealTime = false
  let ad = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: inp, sourcePixelBufferAttributes: [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA, kCVPixelBufferWidthKey as String: ow, kCVPixelBufferHeightKey as String: oh])
  w.add(inp); w.startWriting(); w.startSession(atSourceTime: .zero)
  outs.append(Out(w: w, i: ad, W: ow, H: oh))
}
let srgb = CGColorSpace(name: CGColorSpace.sRGB)!
func readN(_ n: Int) -> Data? {
  var d = Data(count: n); var got = 0
  let ok = d.withUnsafeMutableBytes { (p: UnsafeMutableRawBufferPointer) -> Bool in
    while got < n { let r = fread(p.baseAddress! + got, 1, n - got, stdin); if r <= 0 { return false }; got += r }
    return true }
  return ok ? d : nil
}
var n: Int64 = 0
while let hd = readN(4) {
  let len = Int(hd.withUnsafeBytes { $0.load(as: UInt32.self) })
  guard let data = readN(len), let src = CGImageSourceCreateWithData(data as CFData, nil),
        let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else { FileHandle.standardError.write("bad frame \(n)\n".data(using: .utf8)!); break }
  for o in outs {
    while !o.i.assetWriterInput.isReadyForMoreMediaData { usleep(1000) }
    var pb: CVPixelBuffer?; CVPixelBufferPoolCreatePixelBuffer(nil, o.i.pixelBufferPool!, &pb); let p = pb!
    CVPixelBufferLockBaseAddress(p, [])
    let ctx = CGContext(data: CVPixelBufferGetBaseAddress(p), width: o.W, height: o.H, bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(p),
                        space: srgb, bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue)!
    ctx.interpolationQuality = .high
    ctx.draw(img, in: CGRect(x: 0, y: 0, width: o.W, height: o.H))
    CVPixelBufferUnlockBaseAddress(p, [])
    if !o.i.append(p, withPresentationTime: CMTime(value: n, timescale: FPS)) { FileHandle.standardError.write("append failed: \(String(describing: o.w.error))\n".data(using: .utf8)!) }
  }
  n += 1
}
for o in outs { o.i.assetWriterInput.markAsFinished(); let sem = DispatchSemaphore(value: 0); o.w.finishWriting { sem.signal() }; sem.wait()
  print("\(o.w.outputURL.lastPathComponent): \(n) frames, status \(o.w.status.rawValue) \(o.w.error?.localizedDescription ?? "")") }
