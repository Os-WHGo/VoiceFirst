import ExpoModulesCore
import AVFoundation

/** Read-only observation of this app's AVAudioSession input route.
 * Never changes the audio category, activates a session, starts recording,
 * or claims that SpeechRecognizer/Meta DAT produced verified PCM samples.
 */
public class VoiceFirstAudioRouteModule: Module {
  private var notification: NSObjectProtocol?

  public func definition() -> ModuleDefinition {
    Name("VoiceFirstAudioRoute")
    Events("onInputRouteChanged")

    AsyncFunction("getInputSnapshotAsync") {
      self.snapshot()
    }

    OnStartObserving("onInputRouteChanged") {
      self.startObserving()
    }
    OnStopObserving("onInputRouteChanged") {
      self.stopObserving()
    }
    OnDestroy {
      self.stopObserving()
    }
  }

  private func inputKind(_ port: AVAudioSession.Port) -> String {
    switch port {
    case .builtInMic:
      return "built-in"
    case .bluetoothHFP:
      return "bluetooth-hfp"
    case .headsetMic, .lineIn:
      return "wired"
    case .usbAudio:
      return "usb"
    default:
      return "unknown"
    }
  }

  private func snapshot() -> [String: Any] {
    let currentInputs = AVAudioSession.sharedInstance().currentRoute.inputs
    let ports: [[String: String]] = currentInputs.map { port in
      ["id": port.uid, "kind": self.inputKind(port.portType)]
    }
    return [
      "platform": "ios",
      "scope": "app-audio-session",
      "activeInputId": currentInputs.first?.uid ?? NSNull(),
      // Only the CURRENT session's input ports, not merely paired devices.
      "connectedInputs": ports,
      "observedAtEpochMs": Date().timeIntervalSince1970 * 1000.0
    ]
  }

  private func startObserving() {
    guard notification == nil else { return }
    notification = NotificationCenter.default.addObserver(
      forName: AVAudioSession.routeChangeNotification,
      object: AVAudioSession.sharedInstance(),
      queue: .main
    ) { [weak self] _ in
      guard let self = self else { return }
      self.sendEvent("onInputRouteChanged", self.snapshot())
    }
    // Deliberately do NOT call AVAudioSession.setActive here.
  }

  private func stopObserving() {
    if let token = notification {
      NotificationCenter.default.removeObserver(token)
      notification = nil
    }
  }
}
