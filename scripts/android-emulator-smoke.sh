#!/usr/bin/env bash
set -euo pipefail
apk="${1:?APK path required}"
pkg="com.oswhgo.voicefirst"
failed=0
collect() { adb logcat -d -t 3000 > android-emulator-logcat.txt || true; }
trap collect EXIT
adb install -r "$apk"
capture() {
  local mode="$1"
  if ! adb shell am start -W -n "$pkg/.MainActivity"; then
    echo "::error::$mode: launch failed"; failed=1
  fi
  sleep 15
  if ! adb shell pidof "$pkg" > "voicefirst-$mode-pid.txt"; then
    echo PROCESS_NOT_RUNNING > "voicefirst-$mode-pid.txt"
    echo "::error::$mode: process not running"; failed=1
  fi
  adb shell uiautomator dump "/sdcard/voicefirst-ui-$mode.xml" || true
  adb pull "/sdcard/voicefirst-ui-$mode.xml" "voicefirst-ui-$mode.xml" || true
  adb exec-out screencap -p > "voicefirst-$mode.png" || true
  if ! grep -q 'Aprende con tu voz' "voicefirst-ui-$mode.xml" 2>/dev/null; then
    echo "::error::$mode: expected UI text missing"; failed=1
  fi
}
capture online
adb shell am force-stop "$pkg"
adb shell cmd connectivity airplane-mode enable
adb shell svc wifi disable
adb shell svc data disable
sleep 3
if adb shell ping -c 1 -W 2 8.8.8.8 >/dev/null 2>&1; then
  echo "::error::network still reachable; offline check invalid"; failed=1
fi
capture offline
adb shell input swipe 500 1550 500 450 550 || true
sleep 2
adb shell uiautomator dump /sdcard/voicefirst-ui-scroll.xml || true
adb pull /sdcard/voicefirst-ui-scroll.xml voicefirst-ui-scroll.xml || true
adb exec-out screencap -p > voicefirst-scrolled.png || true
exit "$failed"
