@echo off
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set PATH=%JAVA_HOME%\bin;%PATH%
cd /d "%~dp0android"
call gradlew.bat assembleDebug --no-daemon
echo.
echo === BUILD COMPLETE ===
echo APK: %~dp0android\app\build\outputs\apk\debug\app-debug.apk
