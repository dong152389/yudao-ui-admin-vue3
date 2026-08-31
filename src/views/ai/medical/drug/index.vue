<template>
  <ContentWrap>
    <el-form :inline="true" :model="queryParams" class="-mb-15px">
      <el-form-item label="药品名称">
        <el-input v-model="queryParams.name" placeholder="请输入药品名称" clearable class="!w-240px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="药品分类">
        <el-input v-model="queryParams.category" placeholder="请输入药品分类" clearable class="!w-240px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" />重置</el-button>
        <el-button type="primary" plain @click="openForm('create')" v-hasPermi="['ai:medical-drug:create']">
          <Icon icon="ep:plus" class="mr-5px" />新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="编号" align="center" prop="id" width="70" />
      <el-table-column label="药品名称" align="center" prop="name" width="160" />
      <el-table-column label="分类" align="center" prop="category" width="130" />
      <el-table-column label="适应症" align="center" prop="indications" min-width="200" show-overflow-tooltip />
      <el-table-column label="用法用量" align="center" prop="usageDosage" min-width="200" show-overflow-tooltip />
      <el-table-column label="禁忌" align="center" prop="contraindications" min-width="180" show-overflow-tooltip />
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template #default="scope">
          <el-tag :type="scope.row.status === 0 ? 'success' : 'danger'">
            {{ scope.row.status === 0 ? '开启' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="160">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row.id)" v-hasPermi="['ai:medical-drug:update']">修改</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)" v-hasPermi="['ai:medical-drug:delete']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination v-model:limit="queryParams.pageSize" v-model:page="queryParams.pageNo" :total="total" @pagination="getList" />
  </ContentWrap>

  <Dialog v-model="dialogVisible" :title="dialogTitle" width="760">
    <el-form ref="formRef" v-loading="formLoading" :model="formData" :rules="formRules" label-width="100px">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="药品名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入药品名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="药品分类" prop="category">
            <el-input v-model="formData.category" placeholder="如：解热镇痛药" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="适应症" prop="indications">
        <el-input v-model="formData.indications" type="textarea" :rows="2" placeholder="用于治疗什么疾病或症状" />
      </el-form-item>
      <el-form-item label="用法用量" prop="usageDosage">
        <el-input v-model="formData.usageDosage" type="textarea" :rows="2" placeholder="剂量、频次、服用时间等" />
      </el-form-item>
      <el-form-item label="禁忌" prop="contraindications">
        <el-input v-model="formData.contraindications" type="textarea" :rows="2" />
      </el-form-item>
      <el-form-item label="相互作用" prop="interactions">
        <el-input v-model="formData.interactions" type="textarea" :rows="2" />
      </el-form-item>
      <el-form-item label="不良反应" prop="sideEffects">
        <el-input v-model="formData.sideEffects" type="textarea" :rows="2" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="0">开启</el-radio>
          <el-radio :value="1">停用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { DrugApi, type DrugVO } from '@/api/ai/medical/medical'

defineOptions({ name: 'AiMedicalDrug' })

const message = useMessage()
const loading = ref(true)
const total = ref(0)
const list = ref<DrugVO[]>([])
const queryParams = reactive({ pageNo: 1, pageSize: 10, name: undefined, category: undefined })
const queryFormRef = ref()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formRef = ref()
const formData = ref<DrugVO>({} as DrugVO)
const formRules = {
  name: [{ required: true, message: '药品名称不能为空', trigger: 'blur' }]
}

const getList = async () => {
  loading.value = true
  try {
    const data = await DrugApi.getDrugPage(queryParams)
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
  dialogTitle.value = type === 'create' ? '新增药品' : '修改药品'
  if (id) {
    DrugApi.getDrug(id).then((data) => (formData.value = data))
  } else {
    formData.value = { status: 0 } as DrugVO
  }
}
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    if (formData.value.id) {
      await DrugApi.updateDrug(formData.value)
      message.success('修改成功')
    } else {
      await DrugApi.createDrug(formData.value)
      message.success('新增成功')
    }
    dialogVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

const handleDelete = async (id: number) => {
  await message.delConfirm()
  await DrugApi.deleteDrug(id)
  message.success('删除成功')
  await getList()
}

onMounted(getList)
</script>
