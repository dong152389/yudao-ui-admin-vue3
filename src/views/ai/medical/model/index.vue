<template>
  <el-tabs v-model="activeTab" type="border-card">
    <!-- API 密钥 -->
    <el-tab-pane label="API 密钥" name="apiKey">
      <div class="mb-12px">
        <el-button
          type="primary"
          plain
          @click="openKeyForm('create')"
          v-hasPermi="['ai:api-key:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" />新增密钥
        </el-button>
      </div>
      <el-table v-loading="keyLoading" :data="keyList">
        <el-table-column label="编号" align="center" prop="id" width="70" />
        <el-table-column label="名称" align="center" prop="name" min-width="140" />
        <el-table-column label="平台" align="center" prop="platform" width="120" />
        <el-table-column
          label="API 地址"
          align="center"
          prop="baseUrl"
          min-width="220"
          show-overflow-tooltip
        />
        <el-table-column
          label="密钥"
          align="center"
          prop="apiKey"
          min-width="180"
          show-overflow-tooltip
        />
        <el-table-column label="状态" align="center" prop="status" width="90">
          <template #default="scope">
            <el-tag :type="scope.row.status === 0 ? 'success' : 'danger'">
              {{ scope.row.status === 0 ? '开启' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="160">
          <template #default="scope">
            <el-button
              link
              type="primary"
              @click="openKeyForm('update', scope.row.id)"
              v-hasPermi="['ai:api-key:update']"
              >修改</el-button
            >
            <el-button
              link
              type="danger"
              @click="handleDeleteKey(scope.row.id)"
              v-hasPermi="['ai:api-key:delete']"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-tab-pane>

    <!-- 模型 -->
    <el-tab-pane label="模型管理" name="model">
      <div class="mb-12px">
        <el-button
          type="primary"
          plain
          @click="openModelForm('create')"
          v-hasPermi="['ai:model:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" />新增模型
        </el-button>
      </div>
      <el-table v-loading="modelLoading" :data="modelList">
        <el-table-column label="编号" align="center" prop="id" width="70" />
        <el-table-column label="模型名称" align="center" prop="name" min-width="150" />
        <el-table-column label="模型标识" align="center" prop="model" min-width="180" />
        <el-table-column label="类型" align="center" prop="type" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.type === 1">对话</el-tag>
            <el-tag v-else type="success">向量</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="绑定密钥" align="center" width="140">
          <template #default="scope">{{ getKeyName(scope.row.keyId) }}</template>
        </el-table-column>
        <el-table-column label="温度" align="center" prop="temperature" width="80" />
        <el-table-column label="MaxTokens" align="center" prop="maxTokens" width="100" />
        <el-table-column label="状态" align="center" prop="status" width="90">
          <template #default="scope">
            <el-tag :type="scope.row.status === 0 ? 'success' : 'danger'">
              {{ scope.row.status === 0 ? '开启' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="160">
          <template #default="scope">
            <el-button
              link
              type="primary"
              @click="openModelForm('update', scope.row.id)"
              v-hasPermi="['ai:model:update']"
              >修改</el-button
            >
            <el-button
              link
              type="danger"
              @click="handleDeleteModel(scope.row.id)"
              v-hasPermi="['ai:model:delete']"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-tab-pane>
  </el-tabs>

  <!-- 密钥表单 -->
  <Dialog v-model="keyDialogVisible" :title="keyDialogTitle" width="600">
    <el-form
      ref="keyFormRef"
      v-loading="keyFormLoading"
      :model="keyFormData"
      :rules="keyFormRules"
      label-width="110px"
    >
      <el-form-item label="密钥名称" prop="name">
        <el-input v-model="keyFormData.name" placeholder="如：new-api 中转站" />
      </el-form-item>
      <el-form-item label="平台" prop="platform">
        <el-select v-model="keyFormData.platform">
          <el-option label="OpenAI兼容（new-api 等中转站）" value="OpenAI兼容" />
          <el-option label="Anthropic（官方 API）" value="Anthropic" />
          <el-option label="Gemini（官方 API）" value="Gemini" />
        </el-select>
      </el-form-item>
      <el-form-item label="API 地址" prop="baseUrl">
        <el-input v-model="keyFormData.baseUrl" :placeholder="baseUrlPlaceholder" />
      </el-form-item>
      <el-form-item label="API 密钥" prop="apiKey">
        <el-input v-model="keyFormData.apiKey" placeholder="sk-xxx" show-password />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="keyFormData.status">
          <el-radio :value="0">开启</el-radio>
          <el-radio :value="1">停用</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="keyFormData.remark" type="textarea" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="keyFormLoading" type="primary" @click="submitKeyForm">确 定</el-button>
      <el-button @click="keyDialogVisible = false">取 消</el-button>
    </template>
  </Dialog>

  <!-- 模型表单 -->
  <Dialog v-model="modelDialogVisible" :title="modelDialogTitle" width="600">
    <el-form
      ref="modelFormRef"
      v-loading="modelFormLoading"
      :model="modelFormData"
      :rules="modelFormRules"
      label-width="110px"
    >
      <el-form-item label="模型名称" prop="name">
        <el-input v-model="modelFormData.name" placeholder="显示名称，如：DeepSeek 对话模型" />
      </el-form-item>
      <el-form-item label="模型标识" prop="model">
        <el-input
          v-model="modelFormData.model"
          placeholder="如：deepseek-chat / gpt-4o-mini / text-embedding-3-small"
        />
      </el-form-item>
      <el-form-item label="模型类型" prop="type">
        <el-radio-group v-model="modelFormData.type">
          <el-radio :value="1">对话模型</el-radio>
          <el-radio :value="2">向量模型</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="绑定密钥" prop="keyId">
        <el-select v-model="modelFormData.keyId" placeholder="选择 API 密钥">
          <el-option v-for="key in keyList" :key="key.id" :label="key.name" :value="key.id!" />
        </el-select>
      </el-form-item>
      <template v-if="modelFormData.type === 1">
        <el-form-item label="温度" prop="temperature">
          <el-input-number v-model="modelFormData.temperature" :min="0" :max="2" :step="0.1" />
        </el-form-item>
        <el-form-item label="MaxTokens" prop="maxTokens">
          <el-input-number v-model="modelFormData.maxTokens" :min="256" :step="256" />
        </el-form-item>
      </template>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="modelFormData.status">
          <el-radio :value="0">开启</el-radio>
          <el-radio :value="1">停用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="modelFormLoading" type="primary" @click="submitModelForm"
        >确 定</el-button
      >
      <el-button @click="modelDialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { type AiModelVO, ApiKeyApi, type ApiKeyVO, ModelApi } from '@/api/ai/medical/model'

defineOptions({ name: 'AiModelConfig' })

const message = useMessage()
const activeTab = ref('apiKey')

// ==================== API 密钥 ====================
const keyLoading = ref(false)
const keyList = ref<ApiKeyVO[]>([])

const keyDialogVisible = ref(false)
const keyDialogTitle = ref('')
const keyFormLoading = ref(false)
const keyFormRef = ref()
const keyFormData = ref<ApiKeyVO>({} as ApiKeyVO)
const keyFormRules = {
  name: [{ required: true, message: '密钥名称不能为空', trigger: 'blur' }],
  platform: [{ required: true, message: '平台不能为空', trigger: 'change' }],
  apiKey: [{ required: true, message: 'API 密钥不能为空', trigger: 'blur' }]
}

// API 地址提示按平台变化：Gemini 官方端点固定；Anthropic 默认官方地址
const baseUrlPlaceholder = computed(() => {
  if (keyFormData.value.platform === 'Gemini') {
    return 'Gemini 官方端点固定，无需填写'
  }
  if (keyFormData.value.platform === 'Anthropic') {
    return '可选，默认 https://api.anthropic.com'
  }
  return 'OpenAI 兼容中转地址，如 https://xxx.com/v1'
})

const getKeyList = async () => {
  keyLoading.value = true
  try {
    const data = await ApiKeyApi.getApiKeyPage({ pageNo: 1, pageSize: 100 })
    keyList.value = data.list
  } finally {
    keyLoading.value = false
  }
}

const openKeyForm = (type: string, id?: number) => {
  keyDialogVisible.value = true
  keyDialogTitle.value = type === 'create' ? '新增 API 密钥' : '修改 API 密钥'
  if (id) {
    ApiKeyApi.getApiKey(id).then((data) => (keyFormData.value = data))
  } else {
    keyFormData.value = { status: 0, platform: 'OpenAI兼容' } as ApiKeyVO
  }
}
const submitKeyForm = async () => {
  await keyFormRef.value.validate()
  keyFormLoading.value = true
  try {
    if (keyFormData.value.id) {
      await ApiKeyApi.updateApiKey(keyFormData.value)
      message.success('修改成功')
    } else {
      await ApiKeyApi.createApiKey(keyFormData.value)
      message.success('新增成功')
    }
    keyDialogVisible.value = false
    await getKeyList()
  } finally {
    keyFormLoading.value = false
  }
}
const handleDeleteKey = async (id: number) => {
  await message.delConfirm()
  await ApiKeyApi.deleteApiKey(id)
  message.success('删除成功')
  await getKeyList()
}

// ==================== 模型 ====================
const modelLoading = ref(false)
const modelList = ref<AiModelVO[]>([])

const modelDialogVisible = ref(false)
const modelDialogTitle = ref('')
const modelFormLoading = ref(false)
const modelFormRef = ref()
const modelFormData = ref<AiModelVO>({} as AiModelVO)
const modelFormRules = {
  name: [{ required: true, message: '模型名称不能为空', trigger: 'blur' }],
  model: [{ required: true, message: '模型标识不能为空', trigger: 'blur' }],
  keyId: [{ required: true, message: '绑定密钥不能为空', trigger: 'change' }]
}

const getKeyName = (id: number) => keyList.value.find((key) => key.id === id)?.name ?? id

const getModelList = async () => {
  modelLoading.value = true
  try {
    const data = await ModelApi.getModelPage({ pageNo: 1, pageSize: 100 })
    modelList.value = data.list
  } finally {
    modelLoading.value = false
  }
}

const openModelForm = (type: string, id?: number) => {
  modelDialogVisible.value = true
  modelDialogTitle.value = type === 'create' ? '新增模型' : '修改模型'
  if (id) {
    ModelApi.getModel(id).then((data) => (modelFormData.value = data))
  } else {
    modelFormData.value = { type: 1, status: 0, temperature: 0.7, maxTokens: 4096 } as AiModelVO
  }
}
const submitModelForm = async () => {
  await modelFormRef.value.validate()
  modelFormLoading.value = true
  try {
    if (modelFormData.value.id) {
      await ModelApi.updateModel(modelFormData.value)
      message.success('修改成功')
    } else {
      await ModelApi.createModel(modelFormData.value)
      message.success('新增成功')
    }
    modelDialogVisible.value = false
    await getModelList()
  } finally {
    modelFormLoading.value = false
  }
}
const handleDeleteModel = async (id: number) => {
  await message.delConfirm()
  await ModelApi.deleteModel(id)
  message.success('删除成功')
  await getModelList()
}

onMounted(async () => {
  await Promise.all([getKeyList(), getModelList()])
})
</script>
