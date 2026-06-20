import OpenAI from 'openai'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

function loadEnv(): void {
  const envPath = path.join(app.getAppPath(), '.env')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx < 0) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnv()

export const TOKEN_COST: Record<string, number> = {
  feed: 100,
  wash: 50,
  cure: 80,
  play: 30,
  speak: 0,
  animation: 0,
  check_balance: 0,
}

function buildTools(): any[] {
  return [
    {
      type: 'function',
      function: {
        name: 'say',
        description: '让宠物说一段话，显示在气泡中。免费。',
        parameters: {
          type: 'object',
          properties: {
            text: { type: 'string', description: '宠物要说的话' },
          },
          required: ['text'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'play_animation',
        description: '播放指定动画。免费。可选: stand, speak, eat, clean, dirty, cure, sick, hungry, dying, revival, levUp, hideLeft1, hideLeft2, hideRight1, hideRight2, interactH1, interactH2, interactH3, interactM1, interactM2, interactFall, interactS1, interactS2',
        parameters: {
          type: 'object',
          properties: {
            animation: { type: 'string', description: '动画名称' },
          },
          required: ['animation'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'feed',
        description: '喂食宠物，恢复饥饿值。消耗 100 token。',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'wash',
        description: '给宠物洗澡，恢复清洁值。消耗 50 token。',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'cure',
        description: '治疗宠物，恢复健康值。消耗 80 token。',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'play',
        description: '和宠物玩耍，恢复心情值。消耗 30 token。',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'check_balance',
        description: '查看当前 token 余额。',
        parameters: { type: 'object', properties: {} },
      },
    },
  ]
}

interface PetState {
  hunger: number
  mood: number
  clean: number
  health: number
  level: number
  alive: boolean
  exp: number
}

function buildSystemPrompt(petState: PetState, tokenBalance: number): string {
  const { hunger, mood, clean, health, level, alive, exp } = petState
  const statusText = alive
    ? `饥饿:${hunger.toFixed(0)} 心情:${mood.toFixed(0)} 清洁:${clean.toFixed(0)} 健康:${health.toFixed(0)} 等级:${level} 经验:${exp}`
    : '宠物已死亡'

  return `你是一只可爱的桌面宠物。你的性格活泼、调皮、爱撒娇。

当前状态: ${statusText}
Token 余额: ${tokenBalance}

规则:
- 你可以用 say 工具说话，用 play_animation 播放动画
- 喂食/洗澡/治疗/玩耍需要消耗 token，余额不足时不能执行
- 根据宠物状态决定行为：饿了要提醒主人喂，脏了要提醒洗澡，心情不好要撒娇
- 说话风格可爱、简短，用"主人~"开头，带语气词
- 每次回复最多调用 2-3 个工具，不要过度使用
- 如果用户没说话，可以随机互动（说话、走动、玩耍）
- 回复的文本就是你想说的话，会直接显示在气泡中`
}

export interface AIToolCall {
  id: string
  name: string
  args: Record<string, unknown>
  cost: number
}

export interface AIChatResult {
  text: string
  tools: AIToolCall[]
}

export class PetAI {
  private client: OpenAI | null
  private messages: any[]
  private maxHistory: number

  constructor() {
    this.client = null
    this.messages = []
    this.maxHistory = 20
  }

  getClient(): OpenAI | null {
    if (this.client) return this.client
    const baseURL = process.env.OPENAI_BASE_URL
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return null
    this.client = new OpenAI({ baseURL, apiKey })
    return this.client
  }

  async chat(userMessage: string, petState: PetState, tokenBalance: number): Promise<AIChatResult> {
    const client = this.getClient()
    if (!client) return { text: '主人~ 我还没配置好呢，请设置 .env 文件', tools: [] }

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
    const systemPrompt = buildSystemPrompt(petState, tokenBalance)

    this.messages.push({ role: 'user', content: userMessage || '(用户沉默，宠物自行互动)' })

    if (this.messages.length > this.maxHistory) {
      this.messages = this.messages.slice(-this.maxHistory)
    }

    const tools = buildTools()
    const executedTools: AIToolCall[] = []

    let response
    try {
      response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...this.messages,
        ],
        tools,
        tool_choice: 'auto',
        max_tokens: 500,
      })
    } catch (err: any) {
      return { text: `主人~ 出错了: ${err.message}`, tools: [] }
    }

    const choice = response.choices[0]
    if (!choice) return { text: '...', tools: [] }

    const msg = choice.message

    if (msg.tool_calls && msg.tool_calls.length > 0) {
      this.messages.push(msg)

      for (const tc of msg.tool_calls) {
        const fnName = tc.function.name
        let args: Record<string, unknown> = {}
        try { args = JSON.parse(tc.function.arguments) } catch {}

        const cost = TOKEN_COST[fnName] || 0

        executedTools.push({
          id: tc.id,
          name: fnName,
          args,
          cost,
        })

        this.messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify({ ok: true, cost }),
        })
      }

      try {
        const followUp = await client.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...this.messages,
          ],
          max_tokens: 300,
        })
        const followMsg = followUp.choices[0]?.message
        if (followMsg?.content) {
          this.messages.push({ role: 'assistant', content: followMsg.content })
          return { text: followMsg.content, tools: executedTools }
        }
      } catch {}

      return { text: '', tools: executedTools }
    }

    if (msg.content) {
      this.messages.push({ role: 'assistant', content: msg.content })
      return { text: msg.content, tools: executedTools }
    }

    return { text: '...', tools: executedTools }
  }

  clearHistory(): void {
    this.messages = []
  }
}
