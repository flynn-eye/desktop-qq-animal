import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { getEventDir } from './eventPoller'

function getOpenCodePluginDir(): string {
  return path.join(app.getPath('home'), '.config', 'opencode', 'plugins')
}

function getClaudeSettingsPath(): string {
  return path.join(app.getPath('home'), '.claude', 'settings.json')
}

function getCodexHooksPath(): string {
  return path.join(app.getPath('home'), '.codex', 'hooks.json')
}

// 插件内容（打包后无法读取外部文件，直接内联）
const OPENCODE_PLUGIN = `import fs from 'fs'
import path from 'path'
import os from 'os'

const EVENT_FILE = path.join(os.homedir(), '.qq-pet', 'events.jsonl')

function writeEvent(event) {
  try { fs.appendFileSync(EVENT_FILE, JSON.stringify(event) + '\\n') } catch {}
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
`

function getHookScript(isWindows: boolean): string {
  if (isWindows) {
    return `const fs = require('fs')
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
  const agent = data._agent || 'unknown'

  const eventMap = {
    'SessionStart': { event: 'session_start', agent },
    'PreToolUse': { event: 'tool_start', agent, tool: toolName },
    'PostToolUse': { event: 'tool_end', agent, tool: toolName, status: 'completed' },
    'Stop': { event: 'session_end', agent },
  }

  const out = eventMap[eventName]
  if (out) {
    fs.appendFileSync(eventFile, JSON.stringify(out) + '\\n')
  }
  process.exit(0)
})
`
  }
  // Unix version (same logic, agent is passed via env var or hardcoded)
  return getHookScript(true)
}

function getHookScriptForAgent(agent: string): string {
  return `const fs = require('fs')
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
    'SessionStart': { event: 'session_start', agent: '${agent}' },
    'PreToolUse': { event: 'tool_start', agent: '${agent}', tool: toolName },
    'PostToolUse': { event: 'tool_end', agent: '${agent}', tool: toolName, status: 'completed' },
    'Stop': { event: 'session_end', agent: '${agent}' },
  }

  const out = eventMap[eventName]
  if (out) {
    fs.appendFileSync(eventFile, JSON.stringify(out) + '\\n')
  }
  process.exit(0)
})
`
}

export function installPlugins(): string[] {
  const results: string[] = []
  const eventDir = getEventDir()
  const eventFile = path.join(eventDir, 'events.jsonl')
  if (!fs.existsSync(eventDir)) fs.mkdirSync(eventDir, { recursive: true })
  if (!fs.existsSync(eventFile)) fs.writeFileSync(eventFile, '')

  // 1. OpenCode 插件
  try {
    const ocDir = getOpenCodePluginDir()
    if (!fs.existsSync(ocDir)) fs.mkdirSync(ocDir, { recursive: true })
    fs.writeFileSync(path.join(ocDir, 'opencode-pet.js'), OPENCODE_PLUGIN)
    results.push('OpenCode: OK')
  } catch (e: any) {
    results.push('OpenCode: ' + e.message)
  }

  // 2. Claude Code hooks
  try {
    const hookDst = path.join(eventDir, 'claude-hook.js')
    fs.writeFileSync(hookDst, getHookScriptForAgent('claude-code'))

    const hookCmd = `node "${hookDst}"`
    const settingsPath = getClaudeSettingsPath()
    const settingsDir = path.dirname(settingsPath)
    if (!fs.existsSync(settingsDir)) fs.mkdirSync(settingsDir, { recursive: true })

    let settings: any = {}
    if (fs.existsSync(settingsPath)) {
      try { settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8')) } catch {}
    }
    if (!settings.hooks) settings.hooks = {}

    const events = ['SessionStart', 'PreToolUse', 'PostToolUse', 'Stop']
    for (const eventName of events) {
      const matcher = (eventName === 'PreToolUse' || eventName === 'PostToolUse') ? 'Bash|Edit|Write|Read' : ''
      if (!settings.hooks[eventName]) settings.hooks[eventName] = []
      const existing = settings.hooks[eventName]
      const hasInstalled = existing.some((g: any) =>
        g.hooks?.some((h: any) => h.command?.includes('claude-hook'))
      )
      if (!hasInstalled) {
        const entry: any = { hooks: [{ type: 'command', command: hookCmd, timeout: 5 }] }
        if (matcher) entry.matcher = matcher
        existing.push(entry)
      }
    }

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
    results.push('Claude Code: OK')
  } catch (e: any) {
    results.push('Claude Code: ' + e.message)
  }

  // 3. Codex hooks
  try {
    const hookDst = path.join(eventDir, 'codex-hook.js')
    fs.writeFileSync(hookDst, getHookScriptForAgent('codex'))

    const hookCmd = `node "${hookDst}"`
    const codexDir = path.dirname(getCodexHooksPath())
    if (!fs.existsSync(codexDir)) fs.mkdirSync(codexDir, { recursive: true })

    const hooksPath = getCodexHooksPath()
    let hooks: any = { hooks: {} }
    if (fs.existsSync(hooksPath)) {
      try { hooks = JSON.parse(fs.readFileSync(hooksPath, 'utf-8')) } catch {}
    }
    if (!hooks.hooks) hooks.hooks = {}

    const events = ['SessionStart', 'PreToolUse', 'PostToolUse', 'Stop']
    for (const eventName of events) {
      const matcher = (eventName === 'PreToolUse' || eventName === 'PostToolUse') ? 'Bash|Edit|Write' : ''
      if (!hooks.hooks[eventName]) hooks.hooks[eventName] = []
      const existing = hooks.hooks[eventName]
      const hasInstalled = existing.some((g: any) =>
        g.hooks?.some((h: any) => h.command?.includes('codex-hook'))
      )
      if (!hasInstalled) {
        const entry: any = { hooks: [{ type: 'command', command: hookCmd, timeout: 5 }] }
        if (matcher) entry.matcher = matcher
        existing.push(entry)
      }
    }

    fs.writeFileSync(hooksPath, JSON.stringify(hooks, null, 2))
    results.push('Codex: OK')
  } catch (e: any) {
    results.push('Codex: ' + e.message)
  }

  return results
}
