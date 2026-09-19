#!/usr/bin/env bash
# Собирает debug-подписанный APK: node build.js -> assets/www -> gradlew assembleDebug.
# Требует JDK 17 (Gradle 8.9) и Android SDK (platform 34 / build-tools 34.0.0) —
# в ANDROID_SDK_ROOT или ~/Android/Sdk. Если сборка ругается на class file version,
# у вас слишком новый/старый системный JDK — поставьте: sudo apt install openjdk-17-jdk-headless
set -euo pipefail
cd "$(dirname "$0")"

(cd .. && node build.js)
cp ../index.standalone.html app/src/main/assets/www/index.html

if [ -x "$HOME/.android-build-jdk17/bin/java" ]; then
  export JAVA_HOME="$HOME/.android-build-jdk17"
  export PATH="$JAVA_HOME/bin:$PATH"
fi
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$HOME/Android/Sdk}"

./gradlew assembleDebug
echo "APK: android/app/build/outputs/apk/debug/app-debug.apk"
