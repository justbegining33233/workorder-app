@echo off
setlocal
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "GRADLE_OPTS=-Dorg.gradle.daemon=false"
cd /d "%~dp0android"
echo === FixTray APK Build ===
echo.
cmd /c "gradlew.bat assembleDebug --no-daemon --console=plain -Dorg.gradle.daemon=false"
set BUILD_RESULT=%ERRORLEVEL%
echo.
if %BUILD_RESULT% EQU 0 (
    echo === BUILD SUCCESSFUL ===
    echo APK: %~dp0android\app\build\outputs\apk\debug\app-debug.apk
) else (
    echo === BUILD FAILED ===
)
endlocal
exit /b %BUILD_RESULT%
