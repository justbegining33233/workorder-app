@echo off
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set PATH=%JAVA_HOME%\bin;%PATH%
echo Building FixTray APK...
call gradlew.bat assembleDebug --no-daemon
if %ERRORLEVEL% EQU 0 (
    echo.
    echo BUILD SUCCESSFUL
    echo APK location: app\build\outputs\apk\debug\app-debug.apk
) else (
    echo.
    echo BUILD FAILED - check errors above
)
