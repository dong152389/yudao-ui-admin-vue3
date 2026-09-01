/**
 * AI 流式协议解析层
 *
 * 后端 /ai/chat/message/send-stream 按模型平台输出官方流式格式：
 * - OpenAI：chat.completion.chunk 数据帧（delta.content 增量），以 data: [DONE] 结束，错误帧 {"error":{...}}
 * - Anthropic：官方 messages 命名事件流（content_block_delta(text_delta) / message_stop 等），错误为 event:error
 * - Gemini：官方 streamGenerateContent 流（candidates 增量块，末块 finishReason:"STOP"），错误为 {"error":{...}}
 *
 * resolveDialect 与后端 AiPlatformEnum.of 的归一化规则保持一致；
 * parseStreamEvent 把三种方言统一归一化为页面使用的 {type, content, message} 事件。
 */

export type StreamDialect = 'openai' | 'anthropic' | 'gemini'

/** 归一化后的页面级流事件 */
export interface MedicalStreamEvent {
  type: 'content' | 'done' | 'error'
  content?: string
  message?: string
}

/** fetchEventSource 交给 onmessage 的原始 SSE 事件 */
export interface RawSseEvent {
  event: string
  data: string
}

export function resolveDialect(platform?: string): StreamDialect {
  if (!platform) {
    return 'openai'
  }
  const value = platform.toLowerCase()
  if (value.includes('anthropic') || value.includes('claude')) {
    return 'anthropic'
  }
  if (value.includes('gemini') || value.includes('google') || value.includes('vertex')) {
    return 'gemini'
  }
  return 'openai'
}

export function parseStreamEvent(dialect: StreamDialect, raw: RawSseEvent): MedicalStreamEvent {
  switch (dialect) {
    case 'anthropic':
      return parseAnthropicEvent(raw)
    case 'gemini':
      return parseGeminiEvent(raw)
    default:
      return parseOpenAiEvent(raw)
  }
}

function parseOpenAiEvent(raw: RawSseEvent): MedicalStreamEvent {
  if (raw.data === '[DONE]') {
    return { type: 'done' }
  }
  if (!raw.data) {
    return { type: 'content' }
  }
  let payload: any
  try {
    payload = JSON.parse(raw.data)
  } catch {
    return { type: 'content' }
  }
  if (payload.error) {
    return { type: 'error', message: payload.error.message || 'AI 请求失败' }
  }
  const delta = payload.choices?.[0]?.delta
  if (typeof delta?.content === 'string' && delta.content) {
    return { type: 'content', content: delta.content }
  }
  // tool_calls 等非文本增量：工具在服务端执行，忽略
  return { type: 'content' }
}

function parseAnthropicEvent(raw: RawSseEvent): MedicalStreamEvent {
  if (raw.event === 'error') {
    let message = 'AI 请求失败'
    try {
      const payload = JSON.parse(raw.data)
      message = payload.error?.message || message
    } catch {
      // 保留默认错误提示
    }
    return { type: 'error', message }
  }
  if (raw.event === 'message_stop') {
    return { type: 'done' }
  }
  if (raw.event === 'content_block_delta' && raw.data) {
    try {
      const payload = JSON.parse(raw.data)
      if (payload.delta?.type === 'text_delta' && payload.delta.text) {
        return { type: 'content', content: payload.delta.text }
      }
    } catch {
      // 非 JSON 帧：忽略
    }
  }
  return { type: 'content' }
}

function parseGeminiEvent(raw: RawSseEvent): MedicalStreamEvent {
  if (!raw.data) {
    return { type: 'content' }
  }
  let payload: any
  try {
    payload = JSON.parse(raw.data)
  } catch {
    return { type: 'content' }
  }
  if (payload.error) {
    return { type: 'error', message: payload.error.message || 'AI 请求失败' }
  }
  const candidate = payload.candidates?.[0]
  const text = candidate?.content?.parts
    ?.map((part: any) => part?.text ?? '')
    .join('')
  if (text) {
    return { type: 'content', content: text }
  }
  if (candidate?.finishReason) {
    return { type: 'done' }
  }
  return { type: 'content' }
}
