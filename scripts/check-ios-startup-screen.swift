// Verify the real, noninteractive Simulator startup screen using system OCR.
// This checks rendered React Native content, not microphone/audio/device QA.
import Foundation
import CoreGraphics
import ImageIO
import Vision
import Darwin

func normalized(_ text: String) -> String {
    let folded = text.folding(options: [.caseInsensitive, .diacriticInsensitive],
                              locale: Locale(identifier: "es_ES")).lowercased()
    let words = folded.unicodeScalars.map { scalar in
        CharacterSet.alphanumerics.contains(scalar) ? String(scalar) : " "
    }.joined()
    return words.split(whereSeparator: { $0.isWhitespace }).joined(separator: " ")
}

func fail() -> Never {
    // Deliberately omit OCR text, image paths and arbitrary framework errors.
    print("Simulator startup screen verification failed.")
    exit(1)
}

guard CommandLine.arguments.count == 2 else { fail() }
let imageURL = URL(fileURLWithPath: CommandLine.arguments[1])
guard let source = CGImageSourceCreateWithURL(imageURL as CFURL, nil),
      let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else { fail() }

let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.recognitionLanguages = ["es-ES", "en-US"]
request.usesLanguageCorrection = true

do {
    try VNImageRequestHandler(cgImage: image, options: [:]).perform([request])
} catch {
    fail()
}

// Vision boxes use a bottom-left origin. Reading top-to-bottom also joins a
// wrapped heading without needing an app-side test hook or accessibility API.
let observations = (request.results ?? []).sorted {
    if $0.boundingBox.midY == $1.boundingBox.midY {
        return $0.boundingBox.minX < $1.boundingBox.minX
    }
    return $0.boundingBox.midY > $1.boundingBox.midY
}
let screenText = normalized(observations.compactMap {
    $0.topCandidates(1).first?.string
}.joined(separator: " "))
let padded = " " + screenText + " "
let titleVisible = padded.contains(" aprende con tu voz ")
let playButtonVisible = padded.contains(" escuchar ejemplo ")
print("{\"startupTitleVisible\":\(titleVisible),\"playButtonVisible\":\(playButtonVisible)}")
guard titleVisible && playButtonVisible else { fail() }
print("Simulator startup screen verified: title and inactive playback control rendered.")
