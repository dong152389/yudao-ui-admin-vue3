<template>
  <div class="flex h-[calc(100vh-var(--top-tool-height)-var(--tags-view-height))] overflow-hidden">
    <!-- 左侧：会话列表 -->
    <div class="w-240px flex flex-col border-r border-solid border-[var(--el-border-color)] bg-white">
      <div class="p-12px">
        <el-button type="primary" class="w-full" @click="handleCreateConversation">
          <Icon icon="ep:plus" class="mr-5px" /> 新建对话
        </el-button>
      </div>
      <el-scrollbar class="flex-1 px-8px">
        <div
          v-for="conversation in conversationList"
          :key="conversation.id"
          class="conversation-item mb-4px cursor-pointer rounded-6px px-10px py-8px text-14px"
          :class="{ active: conversation.id === activeConversationId }"
          @click="handleSelectConversation(conversation.id!)"
        >
          <div class="flex items-center justify-between">
            <span class="truncate">{{ conversation.title }}</span>
            <el-icon
              class="delete-btn"
              @click.stop="handleDeleteConversation(conversation.id!)"
            >
              <Icon icon="ep:delete" />
            </el-icon>
          </div>
        </div>
        <el-empty v-if="conversationList.length === 0" description="暂无会话" :image-size="60" />
      </el-scrollbar>
    </div>

    <!-- 中间：对话区 -->
    <div class="flex flex-1 flex-col bg-[var(--el-bg-color-page)]">
      <!-- 顶部工具栏 -->
      <div class="flex items-center gap-12px border-b border-solid border-[var(--el-border-color)] bg-white px-16px py-10px">
        <span class="text-15px font-bold">{{ activeRoleName || '医疗健康助手' }}</span>
        <el-select
          v-model="activeRoleId"
          placeholder="切换医疗角色"
          class="!w-200px"
          @change="handleRoleChange"
        >
          <el-option
            v-for="role in roleList"
            :key="role.id"
            :label="role.name"
            :value="role.id"
          >
            <div class="flex flex-col">
              <span>{{ role.name }}</span>
              <span class="text-12px text-gray-400">{{ role.description }}</span>
            </div>
          </el-option>
        </el-select>
        <el-select v-model="activeModelId" placeholder="切换模型" class="!w-200px">
          <el-option
            v-for="model in modelList"
            :key="model.id"
            :label="model.name"
            :value="model.id!"
          />
        </el-select>
      </div>

      <!-- 消息列表 -->
      <el-scrollbar ref="messageScrollbarRef" class="flex-1 px-16px">
        <div class="mx-auto max-w-800px py-16px">
          <div v-if="messageList.length === 0" class="py-80px text-center">
            <div class="mb-12px text-40px">🏥</div>
            <div class="mb-6px text-18px font-bold">AI 医疗助手</div>
            <div class="text-14px text-gray-500">
              描述你的症状，我可以帮你推荐科室、查询药品、预约挂号
            </div>
            <div class="mt-16px text-12px text-gray-400">
              ⚠️ 本助手仅提供健康咨询参考，不能替代专业医疗诊断
            </div>
          </div>
          <div v-for="(item, index) in messageList" :key="index" class="mb-16px">
            <!-- 用户消息 -->
            <div v-if="item.type === 'user'" class="flex justify-end">
              <div class="max-w-70% rounded-12px bg-[var(--el-color-primary)] px-14px py-10px text-14px leading-22px text-white whitespace-pre-wrap">
                {{ item.content }}
              </div>
            </div>
            <!-- AI 消息 -->
            <div v-else class="flex justify-start">
              <div class="max-w-85% rounded-12px bg-white px-14px py-10px text-14px leading-24px shadow-sm">
                <div v-if="item.content" class="markdown-body" v-html="renderMarkdown(item.content)" />
                <div v-else class="text-gray-400">
                  <Icon icon="ep:loading" class="animate-spin" /> 思考中…
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-scrollbar>

      <!-- 输入区 -->
      <div class="border-t border-solid border-[var(--el-border-color)] bg-white px-16px py-12px">
        <div class="mx-auto max-w-800px">
          <div class="flex items-end gap-8px">
            <el-input
              v-model="inputContent"
              type="textarea"
              :rows="2"
              resize="none"
              placeholder="描述你的症状或健康问题…（Enter 发送，Shift+Enter 换行）"
              @keydown.enter.exact.prevent="handleSend"
            />
            <el-button
              v-if="!streaming"
              type="primary"
              :disabled="!inputContent.trim()"
              @click="handleSend"
            >
              <Icon icon="ep:promotion" class="mr-4px" /> 发送
            </el-button>
            <el-button v-else type="danger" @click="handleStop">
              <Icon icon="ep:video-pause" class="mr-4px" /> 停止
            </el-button>
          </div>
          <div class="mt-6px text-12px text-gray-400">
            AI 生成内容仅供参考，不能替代执业医师的诊断与治疗建议
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧：我的预约与病历 -->
    <div class="w-280px flex flex-col border-l border-solid border-[var(--el-border-color)] bg-white">
      <el-scrollbar class="flex-1 p-12px">
        <div class="mb-16px">
          <div class="mb-8px text-14px font-bold">
            <Icon icon="ep:tickets" class="mr-4px" /> 我的预约
          </div>
          <div
            v-for="appointment in appointmentList"
            :key="appointment.id"
            class="mb-8px rounded-8px bg-[var(--el-bg-color-page)] px-10px py-8px text-13px"
          >
            <div class="flex justify-between">
              <span class="font-bold">{{ appointment.departmentName }}</span>
              <el-tag v-if="appointment.status === 0" size="small">待就诊</el-tag>
              <el-tag v-else-if="appointment.status === 1" size="small" type="success">已完成</el-tag>
              <el-tag v-else size="small" type="info">已取消</el-tag>
            </div>
            <div class="mt-4px text-gray-500">
              {{ appointment.appointmentDate }} {{ appointment.timeSlot }} · {{ appointment.doctorName }}
            </div>
            <el-button
              v-if="appointment.status === 0"
              link
              type="danger"
              size="small"
              class="mt-4px !p-0"
              @click="handleCancelAppointment(appointment.id!)"
            >
              取消预约
            </el-button>
          </div>
          <el-empty v-if="appointmentList.length === 0" description="暂无预约" :image-size="48" />
        </div>
        <div>
          <div class="mb-8px text-14px font-bold">
            <Icon icon="ep:document" class="mr-4px" /> 预问诊病历
          </div>
          <div
            v-for="record in recordList"
            :key="record.id"
            class="mb-8px cursor-pointer rounded-8px bg-[var(--el-bg-color-page)] px-10px py-8px text-13px"
            @click="handleViewRecord(record)"
          >
            <div class="truncate">
              <span class="font-bold">主诉：</span>{{ record.chiefComplaint }}
            </div>
            <div class="mt-4px text-gray-500">
              建议科室：{{ record.departmentSuggestion || '待定' }}
            </div>
          </div>
          <el-empty v-if="recordList.length === 0" description="暂无病历" :image-size="48" />
        </div>
      </el-scrollbar>
    </div>

    <!-- 病历详情弹窗 -->
    <el-dialog v-model="recordDialogVisible" title="预问诊病历" width="640px">
      <el-descriptions v-if="viewingRecord" :column="1" border>
        <el-descriptions-item label="主诉">{{ viewingRecord.chiefComplaint }}</el-descriptions-item>
        <el-descriptions-item label="现病史">{{ viewingRecord.presentIllness }}</el-descriptions-item>
        <el-descriptions-item label="既往史">{{ viewingRecord.pastHistory }}</el-descriptions-item>
        <el-descriptions-item label="过敏史">{{ viewingRecord.allergyHistory }}</el-descriptions-item>
        <el-descriptions-item label="建议就诊科室">{{ viewingRecord.departmentSuggestion }}</el-descriptions-item>
        <el-descriptions-item label="补充说明">{{ viewingRecord.advice }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import MarkdownIt from 'markdown-it'
import {
  MedicalChatRoleApi,
  MedicalConversationApi,
  MedicalMessageApi,
  type MedicalConversationVO,
  type MedicalMessageVO,
  type MedicalChatRoleVO
} from '@/api/ai/medical/chat'
import {
  AppointmentApi,
  MedicalRecordApi,
  type AppointmentVO,
  type MedicalRecordVO
} from '@/api/ai/medical/medical'
import { ModelApi } from '@/api/ai/medical/model'

defineOptions({ name: 'AiMedicalChat' })

const message = useMessage()

const md = new MarkdownIt({ breaks: true, linkify: true })
const renderMarkdown = (content: string) => md.render(content)

// ========== 会话 ==========
const conversationList = ref<MedicalConversationVO[]>([])
const activeConversationId = ref<number | undefined>()
const activeRoleId = ref<number | undefined>()
const activeModelId = ref<number | undefined>()

const roleList = ref<MedicalChatRoleVO[]>([])
const modelList = ref<any[]>([])
const activeRoleName = computed(
  () => roleList.value.find((role) => role.id === activeRoleId.value)?.name
)

// ========== 消息 ==========
const messageList = ref<MedicalMessageVO[]>([])
const inputContent = ref('')
const streaming = ref(false)
const streamCtrl = ref<AbortController>()
const messageScrollbarRef = ref()

// ========== 右侧面板 ==========
const appointmentList = ref<AppointmentVO[]>([])
const recordList = ref<MedicalRecordVO[]>([])
const recordDialogVisible = ref(false)
const viewingRecord = ref<MedicalRecordVO>()

/** 初始化：加载角色、模型、会话列表 */
onMounted(async () => {
  roleList.value = await MedicalChatRoleApi.getSimpleChatRoleList()
  modelList.value = await ModelApi.getSimpleModelList(1)
  const conversations = await MedicalConversationApi.getConversationListMy()
  if (conversations.length > 0) {
    conversationList.value = conversations
    await handleSelectConversation(conversations[0].id!)
  } else {
    await handleCreateConversation()
  }
  await loadRightPanels()
})

/** 创建新会话 */
const handleCreateConversation = async () => {
  const conversationId = await MedicalConversationApi.createConversationMy({
    roleId: activeRoleId.value,
    modelId: activeModelId.value ?? undefined
  })
  conversationList.value = await MedicalConversationApi.getConversationListMy()
  await handleSelectConversation(conversationId)
}

/** 选择会话 */
const handleSelectConversation = async (id: number) => {
  activeConversationId.value = id
  const conversation = await MedicalConversationApi.getConversationMy(id)
  activeRoleId.value = conversation.roleId
  activeModelId.value = conversation.modelId
  messageList.value = await MedicalMessageApi.getMessageListMy(id)
  scrollToBottom()
}

/** 删除会话 */
const handleDeleteConversation = async (id: number) => {
  await message.confirm('确认删除该会话？删除后不可恢复')
  await MedicalConversationApi.deleteConversationMy(id)
  if (activeConversationId.value === id) {
    const remaining = conversationList.value.filter((item) => item.id !== id)
    if (remaining.length > 0) {
      await handleSelectConversation(remaining[0].id!)
    } else {
      await handleCreateConversation()
    }
  }
  conversationList.value = await MedicalConversationApi.getConversationListMy()
}

/** 切换角色（更新会话绑定） */
const handleRoleChange = async () => {
  if (!activeConversationId.value) return
  await MedicalConversationApi.updateConversationMy({
    id: activeConversationId.value,
    modelId: activeModelId.value!,
    roleId: activeRoleId.value
  })
  message.success('已切换角色')
}

/** 切换模型（更新会话绑定） */
watch(activeModelId, async (newVal, oldVal) => {
  if (!activeConversationId.value || oldVal === undefined) return
  await MedicalConversationApi.updateConversationMy({
    id: activeConversationId.value,
    modelId: newVal!,
    roleId: activeRoleId.value
  })
})

/** 发送消息（SSE 流式） */
const handleSend = async () => {
  const content = inputContent.value.trim()
  if (!content || !activeConversationId.value || streaming.value) return
  inputContent.value = ''
  // 本地先展示用户消息与 AI 占位
  messageList.value.push({ conversationId: activeConversationId.value, type: 'user', content })
  const assistantMessage: MedicalMessageVO = {
    conversationId: activeConversationId.value,
    type: 'assistant',
    content: ''
  }
  messageList.value.push(assistantMessage)
  streaming.value = true
  streamCtrl.value = new AbortController()
  scrollToBottom()

  let errorTip = ''
  try {
    await MedicalMessageApi.sendMessageStream(
      activeConversationId.value,
      content,
      streamCtrl.value,
      (event) => {
        if (event.type === 'content' && event.content) {
          assistantMessage.content += event.content
          scrollToBottom()
        } else if (event.type === 'error') {
          errorTip = event.message || 'AI 请求失败'
        } else if (event.type === 'done') {
          // 工具可能产生了新的预约或病历，刷新右侧面板
          loadRightPanels()
        }
      },
      (error) => {
        errorTip = error?.message || '连接中断'
      }
    )
  } catch (error: any) {
    if (error?.name !== 'AbortError') {
      errorTip = error?.message || 'AI 请求失败'
    }
  } finally {
    streaming.value = false
    if (errorTip) {
      assistantMessage.content = assistantMessage.content || ''
      if (!assistantMessage.content) {
        messageList.value.pop()
      }
      message.error(errorTip)
    }
    // 重新加载历史，保证与服务端一致
    messageList.value = await MedicalMessageApi.getMessageListMy(activeConversationId.value)
    scrollToBottom()
  }
}

/** 停止生成 */
const handleStop = () => {
  streamCtrl.value?.abort()
  streaming.value = false
}

/** 滚动到底部 */
const scrollToBottom = async () => {
  await nextTick()
  const scrollbar = messageScrollbarRef.value
  if (scrollbar) {
    scrollbar.setScrollTop(scrollbar.wrapRef?.scrollHeight ?? 0)
  }
}

/** 加载右侧面板数据 */
const loadRightPanels = async () => {
  try {
    appointmentList.value = await AppointmentApi.getMyAppointmentList()
    recordList.value = await MedicalRecordApi.getMyRecordList()
  } catch (error) {
    // 面板数据加载失败不影响对话
  }
}

/** 取消预约 */
const handleCancelAppointment = async (id: number) => {
  await message.confirm('确认取消该预约？')
  await AppointmentApi.cancelAppointment(id)
  message.success('已取消预约')
  await loadRightPanels()
}

/** 查看病历详情 */
const handleViewRecord = (record: MedicalRecordVO) => {
  viewingRecord.value = record
  recordDialogVisible.value = true
}
</script>

<style lang="scss" scoped>
.conversation-item {
  transition: all 0.2s;

  &:hover {
    background-color: var(--el-fill-color-light);

    .delete-btn {
      opacity: 1;
    }
  }

  &.active {
    background-color: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }

  .delete-btn {
    opacity: 0;
    transition: opacity 0.2s;
  }
}

/* markdown 消息体的简单排版 */
.markdown-body {
  :deep(p) {
    margin: 0 0 8px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(ul),
  :deep(ol) {
    margin: 4px 0;
    padding-left: 20px;
  }

  :deep(code) {
    background-color: var(--el-fill-color-light);
    border-radius: 4px;
    padding: 1px 4px;
  }

  :deep(table) {
    border-collapse: collapse;
    margin: 8px 0;

    th,
    td {
      border: 1px solid var(--el-border-color-lighter);
      padding: 4px 10px;
    }
  }
}
</style>
