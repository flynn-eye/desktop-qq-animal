@echo off
setlocal enabledelayedexpansion
set "EVENT_FILE=%USERPROFILE%\.qq-pet\events.jsonl"

REM Read JSON from stdin
set "input="
for /f "delims=" %%a in ('more') do set "input=!input!%%a"

REM Extract hook_event_name
echo !input! | findstr /C:"SessionStart" >nul 2>&1 && (
  echo {"event":"session_start","agent":"codex"} >> "%EVENT_FILE%"
  exit /b 0
)

echo !input! | findstr /C:"PreToolUse" >nul 2>&1 && (
  echo {"event":"tool_start","agent":"codex","tool":"Bash"} >> "%EVENT_FILE%"
  exit /b 0
)

echo !input! | findstr /C:"PostToolUse" >nul 2>&1 && (
  echo {"event":"tool_end","agent":"codex","tool":"Bash","status":"completed"} >> "%EVENT_FILE%"
  exit /b 0
)

echo !input! | findstr /C:"Stop" >nul 2>&1 && (
  echo {"event":"session_end","agent":"codex"} >> "%EVENT_FILE%"
  exit /b 0
)

exit /b 0
