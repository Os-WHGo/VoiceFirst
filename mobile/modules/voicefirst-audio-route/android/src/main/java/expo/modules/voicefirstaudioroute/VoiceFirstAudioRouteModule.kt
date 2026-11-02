package expo.modules.voicefirstaudioroute

import android.content.Context
import android.media.AudioDeviceCallback
import android.media.AudioDeviceInfo
import android.media.AudioManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Read-only inventory, not recognition microphone attestation.
 * Android's SpeechRecognizer may capture audio in another process. A visible
 * Bluetooth input does not prove the speech service selected that input.
 * No microphone, permissions, background service or recorder is opened here.
 */
class VoiceFirstAudioRouteModule : Module() {
  private var observer: AudioDeviceCallback? = null
  private val audioManager: AudioManager?
    get() = appContext.reactContext?.getSystemService(Context.AUDIO_SERVICE) as? AudioManager

  override fun definition() = ModuleDefinition {
    Name("VoiceFirstAudioRoute")
    Events("onInputRouteChanged")

    AsyncFunction("getInputSnapshotAsync") {
      snapshot()
    }

    OnStartObserving("onInputRouteChanged") {
      startObserving()
    }

    OnStopObserving("onInputRouteChanged") {
      stopObserving()
    }

    OnDestroy {
      stopObserving()
    }
  }

  private fun classify(device: AudioDeviceInfo): String = when (device.type) {
    AudioDeviceInfo.TYPE_BUILTIN_MIC -> "built-in"
    AudioDeviceInfo.TYPE_BLUETOOTH_SCO -> "bluetooth-hfp"
    AudioDeviceInfo.TYPE_WIRED_HEADSET -> "wired"
    AudioDeviceInfo.TYPE_USB_DEVICE, AudioDeviceInfo.TYPE_USB_ACCESSORY,
    AudioDeviceInfo.TYPE_USB_HEADSET -> "usb"
    else -> "unknown"
  }

  private fun snapshot(): Map<String, Any?> {
    val inputs = try {
      audioManager?.getDevices(AudioManager.GET_DEVICES_INPUTS)
        ?.filter { it.isSource }
        ?.map { mapOf("id" to it.id.toString(), "kind" to classify(it)) }
        ?: emptyList()
    } catch (_: Exception) {
      emptyList<Map<String, String>>()
    }
    return mapOf(
      "platform" to "android",
      "scope" to "connected-inputs-only",
      // An enumerated input is NOT the current SpeechRecognizer input.
      "activeInputId" to null,
      "connectedInputs" to inputs,
      "observedAtEpochMs" to System.currentTimeMillis().toDouble()
    )
  }

  private fun startObserving() {
    val manager = audioManager ?: return
    if (observer != null) return
    val callback = object : AudioDeviceCallback() {
      override fun onAudioDevicesAdded(addedDevices: Array<out AudioDeviceInfo>?) {
        if (addedDevices?.any { it.isSource } == true)
          sendEvent("onInputRouteChanged", snapshot())
      }
      override fun onAudioDevicesRemoved(removedDevices: Array<out AudioDeviceInfo>?) {
        if (removedDevices?.any { it.isSource } == true)
          sendEvent("onInputRouteChanged", snapshot())
      }
    }
    observer = callback
    manager.registerAudioDeviceCallback(callback, null)
  }

  private fun stopObserving() {
    val callback = observer ?: return
    observer = null
    try {
      audioManager?.unregisterAudioDeviceCallback(callback)
    } catch (_: Exception) {
      // Teardown must not hold an app voice turn open.
    }
  }
}
