import request from '@/config/axios'

// 知识库 VO
export interface KnowledgeVO {
  id?: number
  name: string
  description?: string
  embeddingModelId: number
  createTime?: Date
}

export interface KnowledgeDocumentVO {
  id?: number
  knowledgeId: number
  name: string
  url?: string
  tokens?: number
  segmentCount?: number
  sliceStatus?: number
  createTime?: Date
}

export interface KnowledgeSegmentVO {
  id?: number
  documentId: number
  knowledgeId: number
  content?: string
  tokens?: number
  hasVector?: boolean
  createTime?: Date
}

export const KnowledgeApi = {
  getKnowledgePage: async (params: any) => {
    return await request.get({ url: '/ai/knowledge/page', params })
  },
  getKnowledge: async (id: number): Promise<KnowledgeVO> => {
    return await request.get({ url: `/ai/knowledge/get?id=${id}` })
  },
  createKnowledge: async (data: KnowledgeVO) => {
    return await request.post({ url: '/ai/knowledge/create', data })
  },
  updateKnowledge: async (data: KnowledgeVO) => {
    return await request.put({ url: '/ai/knowledge/update', data })
  },
  deleteKnowledge: async (id: number) => {
    return await request.delete({ url: `/ai/knowledge/delete?id=${id}` })
  },

  // 上传文档（解析、切分并向量化，同步返回）
  uploadDocument: async (knowledgeId: number, file: File): Promise<number> => {
    const formData = new FormData()
    formData.append('file', file)
    return await request.upload({
      url: `/ai/knowledge/document/upload?knowledgeId=${knowledgeId}`,
      data: formData
    })
  },
  getDocumentPage: async (params: any) => {
    return await request.get({ url: '/ai/knowledge/document/page', params })
  },
  deleteDocument: async (id: number) => {
    return await request.delete({ url: `/ai/knowledge/document/delete?id=${id}` })
  },

  getSegmentPage: async (params: any) => {
    return await request.get({ url: '/ai/knowledge/segment/page', params })
  },
  deleteSegment: async (id: number) => {
    return await request.delete({ url: `/ai/knowledge/segment/delete?id=${id}` })
  },
  // 检索调试
  searchSegment: async (knowledgeIds: number[], query: string): Promise<KnowledgeSegmentVO[]> => {
    return await request.get({
      url: '/ai/knowledge/segment/search',
      params: { knowledgeIds: knowledgeIds.join(','), query }
    })
  }
}
