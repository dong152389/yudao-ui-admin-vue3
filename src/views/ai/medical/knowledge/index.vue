<template>
  <ContentWrap>
    <el-form :inline="true" :model="queryParams" class="-mb-15px">
      <el-form-item label="知识库名称">
        <el-input v-model="queryParams.name" placeholder="请输入名称" clearable class="!w-240px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" />重置</el-button>
        <el-button type="primary" plain @click="openForm('create')" v-hasPermi="['ai:knowledge:create']">
          <Icon icon="ep:plus" class="mr-5px" />新增知识库
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="编号" align="center" prop="id" width="70" />
      <el-table-column label="名称" align="center" prop="name" min-width="160" />
      <el-table-column label="描述" align="center" prop="description" min-width="200" show-overflow-tooltip />
      <el-table-column label="向量模型" align="center" width="160">
        <template #default="scope">{{ getModelName(scope.row.embeddingModelId) }}</template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="170" />
      <el-table-column label="操作" align="center" width="280">
        <template #default="scope">
          <el-button link type="primary" @click="openDocumentDrawer(scope.row)">文档管理</el-button>
          <el-button link type="primary" @click="openSegmentDrawer(scope.row)">切片检索</el-button>
          <el-button link type="primary" @click="openForm('update', scope.row.id)" v-hasPermi="['ai:knowledge:update']">修改</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)" v-hasPermi="['ai:knowledge:delete']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination v-model:limit="queryParams.pageSize" v-model:page="queryParams.pageNo" :total="total" @pagination="getList" />
  </ContentWrap>

  <!-- 知识库表单 -->
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="600">
    <el-form ref="formRef" v-loading="formLoading" :model="formData" :rules="formRules" label-width="100px">
      <el-form-item label="名称" prop="name">
        <el-input v-model="formData.name" placeholder="如：高血压诊疗指南" />
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input v-model="formData.description" type="textarea" :rows="2" />
      </el-form-item>
      <el-form-item label="向量模型" prop="embeddingModelId">
        <el-select v-model="formData.embeddingModelId" placeholder="选择向量模型（type=2）">
          <el-option v-for="model in embeddingModelList" :key="model.id" :label="`${model.name}（${model.model}）`" :value="model.id!" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>

  <!-- 文档管理抽屉 -->
  <el-drawer v-model="documentDrawerVisible" :title="`文档管理 - ${activeKnowledge?.name}`" size="60%">
    <div class="mb-12px">
      <el-upload
        :show-file-list="false"
        :auto-upload="false"
        accept=".txt,.md,.pdf,.docx"
        :on-change="handleUploadDocument"
      >
        <el-button type="primary" :loading="uploading">
          <Icon icon="ep:upload" class="mr-5px" /> 上传文档（txt / md / pdf / docx）
        </el-button>
      </el-upload>
    </div>
    <el-table v-loading="documentLoading" :data="documentList">
      <el-table-column label="文档名称" align="center" prop="name" min-width="200" />
      <el-table-column label="Token 数" align="center" prop="tokens" width="110" />
      <el-table-column label="切片数" align="center" prop="segmentCount" width="90" />
      <el-table-column label="状态" align="center" prop="sliceStatus" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.sliceStatus === 1" type="success">已完成</el-tag>
          <el-tag v-else-if="scope.row.sliceStatus === 2" type="danger">失败</el-tag>
          <el-tag v-else>待处理</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="170" />
      <el-table-column label="操作" align="center" width="100">
        <template #default="scope">
          <el-button link type="danger" @click="handleDeleteDocument(scope.row.id)" v-hasPermi="['ai:knowledge:delete']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-drawer>

  <!-- 切片与检索抽屉 -->
  <el-drawer v-model="segmentDrawerVisible" :title="`切片与检索 - ${activeKnowledge?.name}`" size="60%">
    <div class="mb-12px flex gap-8px">
      <el-input v-model="searchQuery" placeholder="输入问题，调试 RAG 检索效果" class="!w-400px" @keyup.enter="handleSearch" />
      <el-button type="primary" :loading="searching" @click="handleSearch">检索</el-button>
    </div>
    <el-table v-loading="searching" :data="searchResults" class="mb-16px">
      <el-table-column label="命中内容" min-width="300">
        <template #default="scope">
          <div class="whitespace-pre-wrap text-13px">{{ scope.row.content }}</div>
        </template>
      </el-table-column>
    </el-table>
    <el-divider content-position="left">全部切片</el-divider>
    <el-table v-loading="segmentLoading" :data="segmentList">
      <el-table-column label="编号" align="center" prop="id" width="70" />
      <el-table-column label="切片内容" min-width="320">
        <template #default="scope">
          <div class="whitespace-pre-wrap text-13px">{{ scope.row.content }}</div>
        </template>
      </el-table-column>
      <el-table-column label="Token" align="center" prop="tokens" width="80" />
      <el-table-column label="操作" align="center" width="90">
        <template #default="scope">
          <el-button link type="danger" @click="handleDeleteSegment(scope.row.id)" v-hasPermi="['ai:knowledge:delete']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination v-model:limit="segmentParams.pageSize" v-model:page="segmentParams.pageNo" :total="segmentTotal" @pagination="getSegmentList" />
  </el-drawer>
</template>

<script lang="ts" setup>
import {
  KnowledgeApi,
  type KnowledgeVO,
  type KnowledgeDocumentVO,
  type KnowledgeSegmentVO
} from '@/api/ai/medical/knowledge'
import { ModelApi } from '@/api/ai/medical/model'

defineOptions({ name: 'AiMedicalKnowledge' })

const message = useMessage()
const loading = ref(true)
const total = ref(0)
const list = ref<KnowledgeVO[]>([])
const embeddingModelList = ref<any[]>([])
const queryParams = reactive<any>({ pageNo: 1, pageSize: 10, name: undefined })
const queryFormRef = ref()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formRef = ref()
const formData = ref<KnowledgeVO>({} as KnowledgeVO)
const formRules = {
  name: [{ required: true, message: '知识库名称不能为空', trigger: 'blur' }],
  embeddingModelId: [{ required: true, message: '向量模型不能为空', trigger: 'change' }]
}

// 文档管理
const documentDrawerVisible = ref(false)
const documentLoading = ref(false)
const uploading = ref(false)
const documentList = ref<KnowledgeDocumentVO[]>([])
const activeKnowledge = ref<KnowledgeVO>()

// 切片与检索
const segmentDrawerVisible = ref(false)
const segmentLoading = ref(false)
const segmentList = ref<KnowledgeSegmentVO[]>([])
const segmentTotal = ref(0)
const segmentParams = reactive<any>({ pageNo: 1, pageSize: 10 })
const searchQuery = ref('')
const searching = ref(false)
const searchResults = ref<KnowledgeSegmentVO[]>([])

const getModelName = (id: number) =>
  embeddingModelList.value.find((model) => model.id === id)?.name ?? id

const getList = async () => {
  loading.value = true
  try {
    const data = await KnowledgeApi.getKnowledgePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

const openForm = (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增知识库' : '修改知识库'
  if (id) {
    KnowledgeApi.getKnowledge(id).then((data) => (formData.value = data))
  } else {
    formData.value = {} as KnowledgeVO
  }
}
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    if (formData.value.id) {
      await KnowledgeApi.updateKnowledge(formData.value)
      message.success('修改成功')
    } else {
      await KnowledgeApi.createKnowledge(formData.value)
      message.success('新增成功')
    }
    dialogVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

const handleDelete = async (id: number) => {
  await message.confirm('删除知识库将同时删除其下文档与切片，确认删除？')
  await KnowledgeApi.deleteKnowledge(id)
  message.success('删除成功')
  await getList()
}

// ==================== 文档管理 ====================
const openDocumentDrawer = async (knowledge: KnowledgeVO) => {
  activeKnowledge.value = knowledge
  documentDrawerVisible.value = true
  await getDocumentList()
}
const getDocumentList = async () => {
  documentLoading.value = true
  try {
    const data = await KnowledgeApi.getDocumentPage({
      pageNo: 1,
      pageSize: 100,
      knowledgeId: activeKnowledge.value?.id
    })
    documentList.value = data.list
  } finally {
    documentLoading.value = false
  }
}
const handleUploadDocument = async (file: any) => {
  uploading.value = true
  try {
    await KnowledgeApi.uploadDocument(activeKnowledge.value!.id!, file.raw)
    message.success('文档处理完成（已解析、切分并向量化）')
    await getDocumentList()
  } finally {
    uploading.value = false
  }
}
const handleDeleteDocument = async (id: number) => {
  await message.delConfirm()
  await KnowledgeApi.deleteDocument(id)
  message.success('删除成功')
  await getDocumentList()
}

// ==================== 切片与检索 ====================
const openSegmentDrawer = async (knowledge: KnowledgeVO) => {
  activeKnowledge.value = knowledge
  segmentDrawerVisible.value = true
  searchResults.value = []
  await getSegmentList()
}
const getSegmentList = async () => {
  segmentLoading.value = true
  try {
    const data = await KnowledgeApi.getSegmentPage({
      ...segmentParams,
      knowledgeId: activeKnowledge.value?.id
    })
    segmentList.value = data.list
    segmentTotal.value = data.total
  } finally {
    segmentLoading.value = false
  }
}
const handleSearch = async () => {
  if (!searchQuery.value.trim()) return
  searching.value = true
  try {
    searchResults.value = await KnowledgeApi.searchSegment(
      [activeKnowledge.value!.id!],
      searchQuery.value
    )
    if (searchResults.value.length === 0) {
      message.info('没有检索到相关内容')
    }
  } finally {
    searching.value = false
  }
}
const handleDeleteSegment = async (id: number) => {
  await message.delConfirm()
  await KnowledgeApi.deleteSegment(id)
  message.success('删除成功')
  await getSegmentList()
}

onMounted(async () => {
  await getList()
  embeddingModelList.value = await ModelApi.getSimpleModelList(2)
})
</script>
