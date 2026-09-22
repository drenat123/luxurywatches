@echo off
setlocal
cd /d %~dp0

echo Installing dependencies...
call npm install
if errorlevel 1 goto :fail

echo Building site...
call npm run build
if errorlevel 1 goto :fail

echo Creating HOSTINGER_UPLOAD.zip...
if exist HOSTINGER_UPLOAD.zip del /q HOSTINGER_UPLOAD.zip
powershell -NoProfile -Command "Compress-Archive -Path 'dist\*' -DestinationPath 'HOSTINGER_UPLOAD.zip' -Force"
if errorlevel 1 goto :fail

echo.
echo DONE. Upload the CONTENTS of HOSTINGER_UPLOAD.zip to public_html.
pause
exit /b 0

:fail
echo.
echo Build failed. Copy the error shown above and send it to ChatGPT.
pause
exit /b 1
