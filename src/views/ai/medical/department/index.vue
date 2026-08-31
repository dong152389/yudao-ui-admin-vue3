<template>
  <ContentWrap>
    <el-form :inline="true" :model="queryParams" class="-mb-15px">
      <el-form-item label="科室名称">
        <el-input v-model="queryParams.name" placeholder="请输入科室名称" clearable class="!w-240px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" />重置</el-button>
        <el-button type="primary" plain @click="openForm('create')" v-hasPermi="['ai:medical-department:create']">
          <Icon icon="ep:plus" class="mr-5px" />新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="编号" align="center" prop="id" width="70" />
      <el-table-column label="科室名称" align="center" prop="name" width="120" />
      <el-table-column label="科室介绍" align="center" prop="description" min-width="220" show-overflow-tooltip />
      <el-table-column label="症状关键词" align="center" prop="keywords" min-width="180" show-overflow-tooltip />
      <el-table-column label="门诊位置" align="center" prop="location" width="140" />
      <el-table-column label="排序" align="center" prop="sort" width="70" />
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template #default="scope">
          <el-tag :type="scope.row.status === 0 ? 'success' : 'danger'">
            {{ scope.row.status === 0 ? '开启' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="160">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row.id)" v-hasPermi="['ai:medical-department:update']">修改</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)" v-hasPermi="['ai:medical-department:delete']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination v-model:limit="queryParams.pageSize" v-model:page="queryParams.pageNo" :total="total" @pagination="getList" />
  </ContentWrap>

  <Dialog v-model="dialogVisible" :title="dialogTitle" width="640">
    <el-form ref="formRef" v-loading="formLoading" :model="formData" :rules="formRules" label-width="100px">
      <el-form-item label="科室名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入科室名称" />
      </el-form-item>
      <el-form-item label="科室介绍" prop="description">
        <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="诊疗范围说明，用于 AI 导诊" />
      </el-form-item>
      <el-form-item label="症状关键词" prop="keywords">
        <el-input v-model="formData.keywords" placeholder="逗号分隔，如：发热,咳嗽,头痛" />
      </el-form-item>
      <el-form-item label="门诊位置" prop="location">
        <el-input v-model="formData.location" placeholder="如：门诊楼2层 内科一区" />
      </el-form-item>
      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="formData.sort" :min="0" />
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
import { DepartmentApi, type DepartmentVO } from '@/api/ai/medical/medical'

defineOptions({ name: 'AiMedicalDepartment' })

const message = useMessage()
const loading = ref(true)
const total = ref(0)
const list = ref<DepartmentVO[]>([])
const queryParams = reactive({ pageNo: 1, pageSize: 10, name: undefined })
const queryFormRef = ref()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formRef = ref()
const formData = ref<DepartmentVO>({} as DepartmentVO)
const formRules = {
  name: [{ required: true, message: '科室名称不能为空', trigger: 'blur' }]
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await DepartmentApi.getDepartmentPage(queryParams)
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

/** 新增/修改 */
const openForm = (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增科室' : '修改科室'
  if (id) {
    DepartmentApi.getDepartment(id).then((data) => (formData.value = data))
  } else {
    formData.value = { status: 0, sort: 0 } as DepartmentVO
  }
}
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    if (formData.value.id) {
      await DepartmentApi.updateDepartment(formData.value)
      message.success('修改成功')
    } else {
      await DepartmentApi.createDepartment(formData.value)
      message.success('新增成功')
    }
    dialogVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 删除 */
const handleDelete = async (id: number) => {
  await message.delConfirm()
  await DepartmentApi.deleteDepartment(id)
  message.success('删除成功')
  await getList()
}

onMounted(getList)
</script>
