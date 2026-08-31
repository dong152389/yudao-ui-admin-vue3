<template>
  <ContentWrap>
    <el-form :inline="true" :model="queryParams" class="-mb-15px">
      <el-form-item label="科室">
        <el-select v-model="queryParams.departmentId" placeholder="请选择科室" clearable class="!w-180px">
          <el-option v-for="dept in departmentList" :key="dept.id" :label="dept.name" :value="dept.id!" />
        </el-select>
      </el-form-item>
      <el-form-item label="医生姓名">
        <el-input v-model="queryParams.doctorName" placeholder="请输入医生姓名" clearable class="!w-180px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="排班日期">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" />重置</el-button>
        <el-button type="primary" plain @click="openForm('create')" v-hasPermi="['ai:medical-schedule:create']">
          <Icon icon="ep:plus" class="mr-5px" />新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="编号" align="center" prop="id" width="70" />
      <el-table-column label="科室" align="center" prop="departmentName" width="110">
        <template #default="scope">{{ getDepartmentName(scope.row.departmentId) }}</template>
      </el-table-column>
      <el-table-column label="医生" align="center" width="150">
        <template #default="scope">{{ scope.row.doctorName }}（{{ scope.row.doctorTitle }}）</template>
      </el-table-column>
      <el-table-column label="日期" align="center" prop="scheduleDate" width="110" />
      <el-table-column label="时段" align="center" width="140">
        <template #default="scope">{{ scope.row.timeSlot }} {{ scope.row.timeRange }}</template>
      </el-table-column>
      <el-table-column label="号源" align="center" width="110">
        <template #default="scope">余 {{ scope.row.remainingSlots }} / {{ scope.row.totalSlots }}</template>
      </el-table-column>
      <el-table-column label="挂号费" align="center" prop="fee" width="90" />
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template #default="scope">
          <el-tag :type="scope.row.status === 0 ? 'success' : 'danger'">
            {{ scope.row.status === 0 ? '正常' : '停诊' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="160">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row.id)" v-hasPermi="['ai:medical-schedule:update']">修改</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)" v-hasPermi="['ai:medical-schedule:delete']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination v-model:limit="queryParams.pageSize" v-model:page="queryParams.pageNo" :total="total" @pagination="getList" />
  </ContentWrap>

  <Dialog v-model="dialogVisible" :title="dialogTitle" width="640">
    <el-form ref="formRef" v-loading="formLoading" :model="formData" :rules="formRules" label-width="100px">
      <el-form-item label="科室" prop="departmentId">
        <el-select v-model="formData.departmentId" placeholder="请选择科室">
          <el-option v-for="dept in departmentList" :key="dept.id" :label="dept.name" :value="dept.id!" />
        </el-select>
      </el-form-item>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="医生姓名" prop="doctorName">
            <el-input v-model="formData.doctorName" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="医生职称" prop="doctorTitle">
            <el-input v-model="formData.doctorTitle" placeholder="如：主任医师" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="排班日期" prop="scheduleDate">
            <el-date-picker v-model="formData.scheduleDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="时段" prop="timeSlot">
            <el-select v-model="formData.timeSlot">
              <el-option label="上午" value="上午" />
              <el-option label="下午" value="下午" />
              <el-option label="晚间" value="晚间" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="接诊时间" prop="timeRange">
            <el-input v-model="formData.timeRange" placeholder="如：08:00-12:00" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="挂号费" prop="fee">
            <el-input-number v-model="formData.fee" :min="0" :precision="2" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="号源总数" prop="totalSlots">
            <el-input-number v-model="formData.totalSlots" :min="1" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="剩余号源" prop="remainingSlots">
            <el-input-number v-model="formData.remainingSlots" :min="0" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="0">正常</el-radio>
          <el-radio :value="1">停诊</el-radio>
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
import { DepartmentApi, ScheduleApi, type ScheduleVO } from '@/api/ai/medical/medical'

defineOptions({ name: 'AiMedicalSchedule' })

const message = useMessage()
const loading = ref(true)
const total = ref(0)
const list = ref<ScheduleVO[]>([])
const departmentList = ref<any[]>([])
const dateRange = ref<string[]>()
const queryParams = reactive<any>({ pageNo: 1, pageSize: 10, departmentId: undefined, doctorName: undefined })
const queryFormRef = ref()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formRef = ref()
const formData = ref<ScheduleVO>({} as ScheduleVO)
const formRules = {
  departmentId: [{ required: true, message: '科室不能为空', trigger: 'change' }],
  doctorName: [{ required: true, message: '医生姓名不能为空', trigger: 'blur' }],
  scheduleDate: [{ required: true, message: '排班日期不能为空', trigger: 'change' }],
  timeSlot: [{ required: true, message: '时段不能为空', trigger: 'change' }],
  totalSlots: [{ required: true, message: '号源总数不能为空', trigger: 'blur' }]
}

const getDepartmentName = (id: number) =>
  departmentList.value.find((dept) => dept.id === id)?.name ?? id

const getList = async () => {
  loading.value = true
  try {
    const params = { ...queryParams }
    if (dateRange.value && dateRange.value.length === 2) {
      params.beginScheduleDate = dateRange.value[0]
      params.endScheduleDate = dateRange.value[1]
    }
    const data = await ScheduleApi.getSchedulePage(params)
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
  dateRange.value = undefined
  handleQuery()
}

const openForm = (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增排班' : '修改排班'
  if (id) {
    ScheduleApi.getSchedule(id).then((data) => (formData.value = data))
  } else {
    formData.value = { status: 0, totalSlots: 20, remainingSlots: 20 } as ScheduleVO
  }
}
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    if (formData.value.id) {
      await ScheduleApi.updateSchedule(formData.value)
      message.success('修改成功')
    } else {
      await ScheduleApi.createSchedule(formData.value)
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
  await ScheduleApi.deleteSchedule(id)
  message.success('删除成功')
  await getList()
}

onMounted(async () => {
  await getList()
  departmentList.value = await DepartmentApi.getSimpleDepartmentList()
})
</script>
