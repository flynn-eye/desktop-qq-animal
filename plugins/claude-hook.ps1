$eventFile = "$env:USERPROFILE\.qq-pet\events.jsonl"
$stdin = [Console]::In.ReadToEnd()
if (-not $stdin) { exit 0 }

try {
  $data = $stdin | ConvertFrom-Json
} catch {
  exit 0
}

$eventName = $data.hook_event_name
$toolName = $data.tool_name

$out = switch ($eventName) {
  'SessionStart'  { '{"event":"session_start","agent":"claude-code"}' }
  'PreToolUse'    { "{`"event`":`"tool_start`",`"agent`":`"claude-code`",`"tool`":`"$toolName`"}" }
  'PostToolUse'   { "{`"event`":`"tool_end`",`"agent`":`"claude-code`",`"tool`":`"$toolName`",`"status`":`"completed`"}" }
  'Stop'          { '{"event":"session_end","agent":"claude-code"}' }
}

if ($out) {
  Add-Content -Path $eventFile -Value $out -Encoding utf8
}
