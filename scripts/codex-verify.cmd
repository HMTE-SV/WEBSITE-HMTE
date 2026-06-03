@echo off
setlocal

call npm.cmd run lint || exit /b %ERRORLEVEL%
call npm.cmd test || exit /b %ERRORLEVEL%
call npx.cmd tsc --noEmit || exit /b %ERRORLEVEL%
call npm.cmd run build || exit /b %ERRORLEVEL%
