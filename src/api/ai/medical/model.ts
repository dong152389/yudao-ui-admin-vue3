import request from '@/config/axios'

// API 密钥 VO
export interface ApiKeyVO {
  id?: number
  name: string
  platform?: string
  apiKey: string
  baseUrl?: string
  status?: number
  remark?: string
  createTime?: Date
}

export const ApiKeyApi = {
  getApiKeyPage: async (params: any) => {
    return await request.get({ url: '/ai/api-key/page', params })
  },
  getApiKey: async (id: number): Promise<ApiKeyVO> => {
    return await request.get({ url: `/ai/api-key/get?id=${id}` })
  },
  createApiKey: async (data: ApiKeyVO) => {
    return await request.post({ url: '/ai/api-key/create', data })
  },
  updateApiKey: async (data: ApiKeyVO) => {
    return await request.put({ url: '/ai/api-key/update', data })
  },
  deleteApiKey: async (id: number) => {
    return await request.delete({ url: `/ai/api-key/delete?id=${id}` })
  }
}

// 模型 VO
export interface AiModelVO {
  id?: number
  keyId: number
  name: string
  model: string
  type: number // 1对话 2向量
  platform?: string // 模型平台（来自绑定密钥，决定 SSE 解析哪种官方流式协议）
  temperature?: number
  maxTokens?: number
  status?: number
  remark?: string
  createTime?: Date
}

export const ModelApi = {
  getModelPage: async (params: any) => {
    return await request.get({ url: '/ai/model/page', params })
  },
  getModel: async (id: number): Promise<AiModelVO> => {
    return await request.get({ url: `/ai/model/get?id=${id}` })
  },
  getSimpleModelList: async (type?: number): Promise<AiModelVO[]> => {
    return await request.get({
      url: '/ai/model/simple-list',
      params: type ? { type } : {}
    })
  },
  createModel: async (data: AiModelVO) => {
    return await request.post({ url: '/ai/model/create', data })
  },
  updateModel: async (data: AiModelVO) => {
    return await request.put({ url: '/ai/model/update', data })
  },
  deleteModel: async (id: number) => {
    return await request.delete({ url: `/ai/model/delete?id=${id}` })
  }
}
