import fs from 'fs'
import path from 'path'
import os from 'os'

const EVENT_FILE = path.join(os.homedir(), '.qq-pet', 'events.jsonl')

function writeEvent(event) {
  try { fs.appendFileSync(EVENT_FILE, JSON.stringify(event) + '\n') } catch {}
}

export const PetPlugin = async () => {
  return {
    event: async ({ event }) => {
      switch (event.type) {
        case 'session.created':
          writeEvent({ event: 'session_start', agent: 'opencode' })
          break
        case 'session.idle':
          writeEvent({ event: 'idle', agent: 'opencode' })
          break
        case 'tool.execute.before':
          writeEvent({ event: 'tool_start', agent: 'opencode', tool: event.tool })
          break
        case 'tool.execute.after':
          writeEvent({ event: 'tool_end', agent: 'opencode', tool: event.tool, status: 'completed' })
          break
        case 'session.error':
          writeEvent({ event: 'error', agent: 'opencode', message: String(event.error || '') })
          break
      }
    },
  }
}
