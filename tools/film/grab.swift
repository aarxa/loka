// grab in.mp4 out_prefix t1 t2 ...   writes out_prefix-<t>.jpg frames at those times (seconds)
import Foundation
import AVFoundation
import ImageIO
import UniformTypeIdentifiers
let a = CommandLine.arguments
let asset = AVURLAsset(url: URL(fileURLWithPath: a[1]))
let gen = AVAssetImageGenerator(asset: asset); gen.requestedTimeToleranceBefore = .zero; gen.requestedTimeToleranceAfter = .zero
print("duration", CMTimeGetSeconds(asset.duration))
for t in a[3...] {
  let img = try! gen.copyCGImage(at: CMTime(seconds: Double(t)!, preferredTimescale: 600), actualTime: nil)
  let url = URL(fileURLWithPath: "\(a[2])-\(t).jpg") as CFURL
  let d = CGImageDestinationCreateWithURL(url, UTType.jpeg.identifier as CFString, 1, nil)!
  CGImageDestinationAddImage(d, img, [kCGImageDestinationLossyCompressionQuality: 0.92] as CFDictionary); CGImageDestinationFinalize(d)
  print("wrote", t, img.width, img.height)
}
