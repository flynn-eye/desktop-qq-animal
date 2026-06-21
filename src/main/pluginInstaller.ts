import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { getEventDir } from './eventPoller'

function getPluginsDir(): string {
  return path.join(app.getAppPath(), 'plugins')
}

function getOpenCodePluginDir(): string {
  return path.join(app.getPath('home'), '.config', 'opencode', 'plugins')
}

function getClaudeSettingsPath(): string {
  return path.join(app.getPath('home'), '.claude', 'settings.json')
}

function getCodexHooksPath(): string {
  return path.join(app.getPath('home'), '.codex', 'hooks.json')
}

function getCodexConfigPath(): string {
  return path.join(app.getPath('home'), '.codex', 'config.toml')
}

function readPluginFile(filename: string): string {
  return fs.readFileSync(path.join(getPluginsDir(), filename), 'utf-8')
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
    const content = readPluginFile('opencode-pet.js')
    fs.writeFileSync(path.join(ocDir, 'opencode-pet.js'), content)
    results.push('OpenCode: OK')
  } catch (e: any) {
    results.push('OpenCode: ' + e.message)
  }

  // 2. Claude Code hooks
  try {
    const hookFile = 'claude-hook.js'
    const hookSrc = path.join(getPluginsDir(), hookFile)
    const hookDst = path.join(eventDir, hookFile)
    fs.copyFileSync(hookSrc, hookDst)

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
    const hookFile = 'codex-hook.js'
    const hookSrc = path.join(getPluginsDir(), hookFile)
    const hookDst = path.join(eventDir, hookFile)
    fs.copyFileSync(hookSrc, hookDst)

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
