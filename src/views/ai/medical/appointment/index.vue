<template>
  <ContentWrap>
    <el-form :inline="true" :model="queryParams" class="-mb-15px">
      <el-form-item label="患者姓名">
        <el-input v-model="queryParams.patientName" placeholder="请输入患者姓名" clearable class="!w-200px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-160px">
          <el-option label="待就诊" :value="0" />
          <el-option label="已完成" :value="1" />
          <el-option label="已取消" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" />重置</el-button>
        <el-button type="primary" plain @click="openForm('create')" v-hasPermi="['ai:medical-appointment:create']">
          <Icon icon="ep:plus" class="mr-5px" />代患者挂号
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="编号" align="center" prop="id" width="70" />
      <el-table-column label="患者" align="center" width="170">
        <template #default="scope">{{ scope.row.patientName }}（{{ scope.row.patientPhone }}）</template>
      </el-table-column>
      <el-table-column label="科室" align="center" prop="departmentName" width="110" />
      <el-table-column label="医生" align="center" prop="doctorName" width="100" />
      <el-table-column label="就诊日期" align="center" prop="appointmentDate" width="110" />
      <el-table-column label="时段" align="center" prop="timeSlot" width="80" />
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 0" type="warning">待就诊</el-tag>
          <el-tag v-else-if="scope.row.status === 1" type="success">已完成</el-tag>
          <el-tag v-else type="info">已取消</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" min-width="140" show-overflow-tooltip />
      <el-table-column label="创建时间" align="center" prop="createTime" width="170" />
      <el-table-column label="操作" align="center" width="200">
        <template #default="scope">
          <el-button
            v-if="scope.row.status === 0"
            link type="warning"
            @click="handleCancel(scope.row.id)"
            v-hasPermi="['ai:medical-appointment:update']"
          >取消</el-button>
          <el-button link type="primary" @click="openForm('update', scope.row.id)" v-hasPermi="['ai:medical-appointment:update']">修改</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)" v-hasPermi="['ai:medical-appointment:delete']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination v-model:limit="queryParams.pageSize" v-model:page="queryParams.pageNo" :total="total" @pagination="getList" />
  </ContentWrap>

  <Dialog v-model="dialogVisible" :title="dialogTitle" width="600">
    <el-form ref="formRef" v-loading="formLoading" :model="formData" :rules="formRules" label-width="100px">
      <el-form-item label="排班" prop="scheduleId">
        <el-select v-model="formData.scheduleId" filterable placeholder="选择可预约的排班（含余号）" :disabled="isUpdate">
          <el-option
            v-for="schedule in availableSchedules"
            :key="schedule.id"
            :label="`${getDepartmentName(schedule.departmentId)} ${schedule.scheduleDate} ${schedule.timeSlot} ${schedule.doctorName} 余${schedule.remainingSlots}`"
            :value="schedule.id!"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="患者姓名" prop="patientName">
        <el-input v-model="formData.patientName" />
      </el-form-item>
      <el-form-item label="患者手机号" prop="patientPhone">
        <el-input v-model="formData.patientPhone" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { AppointmentApi, DepartmentApi, ScheduleApi, type AppointmentVO } from '@/api/ai/medical/medical'

defineOptions({ name: 'AiMedicalAppointment' })

const message = useMessage()
const loading = ref(true)
const total = ref(0)
const list = ref<AppointmentVO[]>([])
const departmentList = ref<any[]>([])
const availableSchedules = ref<any[]>([])
const queryParams = reactive<any>({ pageNo: 1, pageSize: 10, patientName: undefined, status: undefined })
const queryFormRef = ref()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const isUpdate = ref(false)
const formLoading = ref(false)
const formRef = ref()
const formData = ref<AppointmentVO>({} as AppointmentVO)
const formRules = {
  scheduleId: [{ required: true, message: '排班不能为空', trigger: 'change' }],
  patientName: [{ required: true, message: '患者姓名不能为空', trigger: 'blur' }],
  patientPhone: [{ required: true, message: '患者手机号不能为空', trigger: 'blur' }]
}

const getDepartmentName = (id: number) =>
  departmentList.value.find((dept) => dept.id === id)?.name ?? id

const getList = async () => {
  loading.value = true
  try {
    const data = await AppointmentApi.getAppointmentPage(queryParams)
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

const openForm = async (type: string, id?: number) => {
  dialogVisible.value = true
  isUpdate.value = type === 'update'
  dialogTitle.value = isUpdate.value ? '修改预约信息' : '代患者挂号'
  availableSchedules.value = await ScheduleApi.getSchedulePage({ pageNo: 1, pageSize: 100, status: 0 }).then(
    (res) => res.list.filter((item: any) => item.remainingSlots > 0)
  )
  if (id) {
    formData.value = await AppointmentApi.getAppointment(id)
  } else {
    formData.value = {} as AppointmentVO
  }
}
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    if (isUpdate.value) {
      await AppointmentApi.updateAppointment(formData.value)
      message.success('修改成功')
    } else {
      await AppointmentApi.createAppointment(formData.value)
      message.success('挂号成功')
    }
    dialogVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

const handleCancel = async (id: number) => {
  await message.confirm('确认取消该预约？号源将归还排班。')
  await AppointmentApi.cancelAppointment(id)
  message.success('已取消预约')
  await getList()
}

const handleDelete = async (id: number) => {
  await message.delConfirm()
  await AppointmentApi.deleteAppointment(id)
  message.success('删除成功')
  await getList()
}

onMounted(async () => {
  await getList()
  departmentList.value = await DepartmentApi.getSimpleDepartmentList()
})
</script>
