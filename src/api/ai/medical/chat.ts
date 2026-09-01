import request from '@/config/axios'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { getAccessToken, getTenantId } from '@/utils/auth'
import { config } from '@/config/axios/config'
import type { RawSseEvent } from '@/api/ai/medical/stream'

// 会话 VO
export interface MedicalConversationVO {
  id?: number
  roleId?: number
  modelId: number
  title?: string
  pinned?: boolean
  temperature?: number
  maxTokens?: number
  maxContexts?: number
  createTime?: Date
}

// 消息 VO
export interface MedicalMessageVO {
  id?: number
  conversationId: number
  type: 'user' | 'assistant' | 'system'
  model?: string
  content: string
  usageTokens?: number
  createTime?: Date
}

// 角色 VO
export interface MedicalChatRoleVO {
  id: number
  name: string
  avatar?: string
  description?: string
  systemPrompt?: string
  knowledgeIds?: number[]
  sort?: number
  status?: number
}

// 会话 API
export const MedicalConversationApi = {
  createConversationMy: async (data?: Partial<MedicalConversationVO>): Promise<number> => {
    return await request.post({ url: '/ai/chat/conversation/create-my', data: data || {} })
  },
  updateConversationMy: async (data: MedicalConversationVO) => {
    return await request.put({ url: '/ai/chat/conversation/update-my', data })
  },
  deleteConversationMy: async (id: number) => {
    return await request.delete({ url: `/ai/chat/conversation/delete-my?id=${id}` })
  },
  getConversationMy: async (id: number): Promise<MedicalConversationVO> => {
    return await request.get({ url: `/ai/chat/conversation/get-my?id=${id}` })
  },
  getConversationListMy: async (): Promise<MedicalConversationVO[]> => {
    return await request.get({ url: '/ai/chat/conversation/my-list' })
  }
}

// 消息 API
export const MedicalMessageApi = {
  getMessageListMy: async (conversationId: number): Promise<MedicalMessageVO[]> => {
    return await request.get({
      url: `/ai/chat/message/my-list?conversationId=${conversationId}`
    })
  },
  // 流式发送消息（SSE）。onEvent 回调接收原始 SSE 事件（官方格式，方言由调用方经 stream.ts 解析）
  sendMessageStream: async (
    conversationId: number,
    content: string,
    ctrl: AbortController,
    onEvent: (event: RawSseEvent) => void,
    onError: (error: any) => void
  ) => {
    const token = getAccessToken()
    const tenantId = getTenantId()
    return fetchEventSource(`${config.base_url}/ai/chat/message/send-stream`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(tenantId ? { 'tenant-id': tenantId } : {})
      },
      openWhenHidden: true,
      body: JSON.stringify({ conversationId, content }),
      async onmessage(event) {
        onEvent({ event: event.event, data: event.data })
      },
      onerror: onError,
      signal: ctrl.signal
    })
  }
}

// 角色 API（对话页角色选择）
export const MedicalChatRoleApi = {
  getSimpleChatRoleList: async (): Promise<MedicalChatRoleVO[]> => {
    return await request.get({ url: '/ai/chat-role/simple-list' })
  }
}
