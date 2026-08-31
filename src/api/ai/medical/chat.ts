import request from '@/config/axios'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { getAccessToken, getTenantId } from '@/utils/auth'
import { config } from '@/config/axios/config'

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

// SSE 事件
export interface MedicalStreamEvent {
  type: 'content' | 'done' | 'error'
  content?: string
  message?: string
  messageId?: number
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
  // 流式发送消息（SSE）。onEvent 回调接收解析后的事件对象
  sendMessageStream: async (
    conversationId: number,
    content: string,
    ctrl: AbortController,
    onEvent: (event: MedicalStreamEvent) => void,
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
        if (event.data) {
          onEvent(JSON.parse(event.data) as MedicalStreamEvent)
        }
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
