<template>
  <ContentWrap>
    <el-form :inline="true" :model="queryParams" class="-mb-15px">
      <el-form-item label="主诉">
        <el-input v-model="queryParams.chiefComplaint" placeholder="请输入主诉关键词" clearable class="!w-240px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" />重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="编号" align="center" prop="id" width="70" />
      <el-table-column label="用户编号" align="center" prop="userId" width="90" />
      <el-table-column label="主诉" align="center" prop="chiefComplaint" min-width="200" show-overflow-tooltip />
      <el-table-column label="现病史" align="center" prop="presentIllness" min-width="220" show-overflow-tooltip />
      <el-table-column label="过敏史" align="center" prop="allergyHistory" width="140" show-overflow-tooltip />
      <el-table-column label="建议科室" align="center" prop="departmentSuggestion" width="110" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="170" />
      <el-table-column label="操作" align="center" width="160">
        <template #default="scope">
          <el-button link type="primary" @click="handleDetail(scope.row.id)">详情</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)" v-hasPermi="['ai:medical-record:delete']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination v-model:limit="queryParams.pageSize" v-model:page="queryParams.pageNo" :total="total" @pagination="getList" />
  </ContentWrap>

  <Dialog v-model="detailVisible" title="预问诊病历详情" width="680">
    <el-descriptions v-if="detailData" :column="1" border>
      <el-descriptions-item label="主诉">{{ detailData.chiefComplaint }}</el-descriptions-item>
      <el-descriptions-item label="现病史">{{ detailData.presentIllness }}</el-descriptions-item>
      <el-descriptions-item label="既往史">{{ detailData.pastHistory }}</el-descriptions-item>
      <el-descriptions-item label="过敏史">{{ detailData.allergyHistory }}</el-descriptions-item>
      <el-descriptions-item label="建议就诊科室">{{ detailData.departmentSuggestion }}</el-descriptions-item>
      <el-descriptions-item label="补充说明">{{ detailData.advice }}</el-descriptions-item>
    </el-descriptions>
  </Dialog>
</template>

<script lang="ts" setup>
import { MedicalRecordApi, type MedicalRecordVO } from '@/api/ai/medical/medical'

defineOptions({ name: 'AiMedicalRecord' })

const message = useMessage()
const loading = ref(true)
const total = ref(0)
const list = ref<MedicalRecordVO[]>([])
const queryParams = reactive<any>({ pageNo: 1, pageSize: 10, chiefComplaint: undefined })
const queryFormRef = ref()

const detailVisible = ref(false)
const detailData = ref<MedicalRecordVO>()

const getList = async () => {
  loading.value = true
  try {
    const data = await MedicalRecordApi.getRecordPage(queryParams)
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

const handleDetail = async (id: number) => {
  detailData.value = await MedicalRecordApi.getRecord(id)
  detailVisible.value = true
}

const handleDelete = async (id: number) => {
  await message.delConfirm()
  await MedicalRecordApi.deleteRecord(id)
  message.success('删除成功')
  await getList()
}

onMounted(getList)
</script>
