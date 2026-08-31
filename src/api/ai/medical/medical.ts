import request from '@/config/axios'

// ==================== 科室 ====================
export interface DepartmentVO {
  id?: number
  name: string
  description?: string
  keywords?: string
  location?: string
  sort?: number
  status?: number
  createTime?: Date
}

export const DepartmentApi = {
  getDepartmentPage: async (params: any) => {
    return await request.get({ url: '/ai/medical/department/page', params })
  },
  getSimpleDepartmentList: async (): Promise<DepartmentVO[]> => {
    return await request.get({ url: '/ai/medical/department/simple-list' })
  },
  getDepartment: async (id: number): Promise<DepartmentVO> => {
    return await request.get({ url: `/ai/medical/department/get?id=${id}` })
  },
  createDepartment: async (data: DepartmentVO) => {
    return await request.post({ url: '/ai/medical/department/create', data })
  },
  updateDepartment: async (data: DepartmentVO) => {
    return await request.put({ url: '/ai/medical/department/update', data })
  },
  deleteDepartment: async (id: number) => {
    return await request.delete({ url: `/ai/medical/department/delete?id=${id}` })
  }
}

// ==================== 药品 ====================
export interface DrugVO {
  id?: number
  name: string
  category?: string
  indications?: string
  usageDosage?: string
  contraindications?: string
  interactions?: string
  sideEffects?: string
  status?: number
  createTime?: Date
}

export const DrugApi = {
  getDrugPage: async (params: any) => {
    return await request.get({ url: '/ai/medical/drug/page', params })
  },
  getDrug: async (id: number): Promise<DrugVO> => {
    return await request.get({ url: `/ai/medical/drug/get?id=${id}` })
  },
  createDrug: async (data: DrugVO) => {
    return await request.post({ url: '/ai/medical/drug/create', data })
  },
  updateDrug: async (data: DrugVO) => {
    return await request.put({ url: '/ai/medical/drug/update', data })
  },
  deleteDrug: async (id: number) => {
    return await request.delete({ url: `/ai/medical/drug/delete?id=${id}` })
  }
}

// ==================== 排班 ====================
export interface ScheduleVO {
  id?: number
  departmentId: number
  departmentName?: string
  doctorName: string
  doctorTitle?: string
  scheduleDate: string
  timeSlot: string
  timeRange?: string
  totalSlots: number
  remainingSlots?: number
  fee?: number
  status?: number
  createTime?: Date
}

export const ScheduleApi = {
  getSchedulePage: async (params: any) => {
    return await request.get({ url: '/ai/medical/schedule/page', params })
  },
  getSchedule: async (id: number): Promise<ScheduleVO> => {
    return await request.get({ url: `/ai/medical/schedule/get?id=${id}` })
  },
  createSchedule: async (data: ScheduleVO) => {
    return await request.post({ url: '/ai/medical/schedule/create', data })
  },
  updateSchedule: async (data: ScheduleVO) => {
    return await request.put({ url: '/ai/medical/schedule/update', data })
  },
  deleteSchedule: async (id: number) => {
    return await request.delete({ url: `/ai/medical/schedule/delete?id=${id}` })
  }
}

// ==================== 预约 ====================
export interface AppointmentVO {
  id?: number
  userId?: number
  patientName: string
  patientPhone: string
  scheduleId: number
  departmentId?: number
  departmentName?: string
  doctorName?: string
  appointmentDate?: string
  timeSlot?: string
  status?: number
  remark?: string
  createTime?: Date
}

export const AppointmentApi = {
  getAppointmentPage: async (params: any) => {
    return await request.get({ url: '/ai/medical/appointment/page', params })
  },
  getAppointment: async (id: number): Promise<AppointmentVO> => {
    return await request.get({ url: `/ai/medical/appointment/get?id=${id}` })
  },
  createAppointment: async (data: AppointmentVO) => {
    return await request.post({ url: '/ai/medical/appointment/create', data })
  },
  updateAppointment: async (data: AppointmentVO) => {
    return await request.put({ url: '/ai/medical/appointment/update', data })
  },
  cancelAppointment: async (id: number) => {
    return await request.put({ url: `/ai/medical/appointment/cancel?id=${id}` })
  },
  deleteAppointment: async (id: number) => {
    return await request.delete({ url: `/ai/medical/appointment/delete?id=${id}` })
  },
  getMyAppointmentList: async (): Promise<AppointmentVO[]> => {
    return await request.get({ url: '/ai/medical/appointment/my-list' })
  }
}

// ==================== 预问诊病历 ====================
export interface MedicalRecordVO {
  id?: number
  userId?: number
  conversationId?: number
  chiefComplaint?: string
  presentIllness?: string
  pastHistory?: string
  allergyHistory?: string
  departmentSuggestion?: string
  advice?: string
  createTime?: Date
}

export const MedicalRecordApi = {
  getRecordPage: async (params: any) => {
    return await request.get({ url: '/ai/medical/record/page', params })
  },
  getRecord: async (id: number): Promise<MedicalRecordVO> => {
    return await request.get({ url: `/ai/medical/record/get?id=${id}` })
  },
  updateRecord: async (data: MedicalRecordVO) => {
    return await request.put({ url: '/ai/medical/record/update', data })
  },
  deleteRecord: async (id: number) => {
    return await request.delete({ url: `/ai/medical/record/delete?id=${id}` })
  },
  getMyRecordList: async (): Promise<MedicalRecordVO[]> => {
    return await request.get({ url: '/ai/medical/record/my-list' })
  }
}
