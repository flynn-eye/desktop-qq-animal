const fs = require('fs')
const path = require('path')

const eventFile = path.join(process.env.USERPROFILE || process.env.HOME, '.qq-pet', 'events.jsonl')

let input = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', chunk => input += chunk)
process.stdin.on('end', () => {
  if (!input.trim()) process.exit(0)

  let data
  try { data = JSON.parse(input) } catch { process.exit(0) }

  const eventName = data.hook_event_name
  const toolName = data.tool_name || ''

  const eventMap = {
    'SessionStart': { event: 'session_start', agent: 'claude-code' },
    'PreToolUse': { event: 'tool_start', agent: 'claude-code', tool: toolName },
    'PostToolUse': { event: 'tool_end', agent: 'claude-code', tool: toolName, status: 'completed' },
    'Stop': { event: 'session_end', agent: 'claude-code' },
  }

  const out = eventMap[eventName]
  if (out) {
    fs.appendFileSync(eventFile, JSON.stringify(out) + '\n')
  }
  process.exit(0)
})
