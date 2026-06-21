#!/bin/bash
EVENT_FILE="$HOME/.qq-pet/events.jsonl"
read -r input
event_name=$(echo "$input" | jq -r '.hook_event_name // empty')
tool_name=$(echo "$input" | jq -r '.tool_name // empty')
case "$event_name" in
  SessionStart) echo '{"event":"session_start","agent":"codex"}' >> "$EVENT_FILE" ;;
  PreToolUse) echo "{\"event\":\"tool_start\",\"agent\":\"codex\",\"tool\":\"$tool_name\"}" >> "$EVENT_FILE" ;;
  PostToolUse) echo "{\"event\":\"tool_end\",\"agent\":\"codex\",\"tool\":\"$tool_name\",\"status\":\"completed\"}" >> "$EVENT_FILE" ;;
  Stop) echo '{"event":"session_end","agent":"codex"}' >> "$EVENT_FILE" ;;
esac
