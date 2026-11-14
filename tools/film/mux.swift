// mux video.mp4 audio.m4a out.mp4 — puts the audio under the video, trimmed to the video's length, without re-encoding either
import Foundation
import AVFoundation
let a = CommandLine.arguments
let v = AVURLAsset(url: URL(fileURLWithPath: a[1])), s = AVURLAsset(url: URL(fileURLWithPath: a[2])), out = URL(fileURLWithPath: a[3])
try? FileManager.default.removeItem(at: out)
let sem = DispatchSemaphore(value: 0)
Task {
  let comp = AVMutableComposition()
  let vt = try await v.loadTracks(withMediaType: .video)[0], st = try await s.loadTracks(withMediaType: .audio)[0]
  let dur = try await v.load(.duration)
  let cv = comp.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid)!
  try cv.insertTimeRange(CMTimeRange(start: .zero, duration: dur), of: vt, at: .zero)
  cv.preferredTransform = try await vt.load(.preferredTransform)
  let ca = comp.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid)!
  let sdur = try await s.load(.duration)
  try ca.insertTimeRange(CMTimeRange(start: .zero, duration: CMTimeMinimum(dur, sdur)), of: st, at: .zero)
  let ex = AVAssetExportSession(asset: comp, presetName: AVAssetExportPresetPassthrough)!
  ex.outputURL = out; ex.outputFileType = .mp4; ex.shouldOptimizeForNetworkUse = true
  await ex.export()
  print(out.lastPathComponent, ex.status.rawValue, ex.error?.localizedDescription ?? "ok")
  sem.signal()
}
sem.wait()
