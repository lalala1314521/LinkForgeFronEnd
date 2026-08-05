<template>
  <div class="support-page">
    <PageHeader title="智能客服" description="AI 客服（演示模式）：可查询订单/支付/发货/退款/积分/优惠券" />

    <div class="app-card chat-card">
      <!-- 消息列表 -->
      <div ref="listRef" class="chat-list">
        <div
          v-for="(msg, i) in messages"
          :key="i"
          class="msg-row"
          :class="msg.role === 'user' ? 'is-user' : 'is-assistant'"
        >
          <div class="msg-bubble">{{ msg.content }}</div>
        </div>
        <div v-if="thinking" class="msg-row is-assistant">
          <div class="msg-bubble thinking">正在思考…</div>
        </div>
        <div v-if="messages.length === 0" class="chat-empty">
          您好，我是 LinkForge 智能客服，有什么可以帮您？
        </div>
      </div>

      <!-- 快捷问题 -->
      <div class="quick-questions">
        <el-tag
          v-for="q in quickQuestions"
          :key="q"
          class="quick-tag"
          round
          effect="plain"
          @click="send(q)"
        >
          {{ q }}
        </el-tag>
      </div>

      <!-- 输入区 -->
      <div class="chat-input">
        <el-input
          v-model="input"
          placeholder="请输入您的问题，如：我的订单状态"
          maxlength="500"
          clearable
          @keyup.enter="send(input)"
        />
        <el-button type="primary" :loading="thinking" :disabled="!input.trim()" @click="send(input)">
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { useSupportApi } from '@/api/support'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const { chat } = useSupportApi()

const messages = ref<ChatMessage[]>([])
const input = ref('')
const thinking = ref(false)
const listRef = ref<HTMLElement | null>(null)

const quickQuestions = ['我的订单状态', '有已发货的订单吗', '我的积分', '怎么取消订单', '优惠券怎么用']

async function send(text: string) {
  const content = text.trim()
  if (!content || thinking.value) return
  messages.value.push({ role: 'user', content })
  input.value = ''
  thinking.value = true
  scrollToBottom()
  try {
    const res = await chat(content)
    messages.value.push({ role: 'assistant', content: res.reply })
  } catch {
    messages.value.push({ role: 'assistant', content: '抱歉，服务暂时不可用，请稍后再试。' })
  } finally {
    thinking.value = false
    scrollToBottom()
  }
}

function scrollToBottom() {
  nextTick(() => {
    listRef.value?.scrollTo({ top: listRef.value.scrollHeight, behavior: 'smooth' })
  })
}
</script>

<style scoped>
.chat-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 560px;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px;
}

.msg-row {
  display: flex;
}

.msg-row.is-user {
  justify-content: flex-end;
}

.msg-row.is-assistant {
  justify-content: flex-start;
}

.msg-bubble {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: var(--radius-md, 8px);
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.is-user .msg-bubble {
  background: var(--primary, #4f6bff);
  color: #fff;
  border-bottom-right-radius: 2px;
}

.is-assistant .msg-bubble {
  background: var(--bg-fill, rgba(128, 128, 128, 0.12));
  border-bottom-left-radius: 2px;
}

.thinking {
  color: var(--text-secondary, #666);
}

.chat-empty {
  text-align: center;
  color: var(--text-secondary, #666);
  padding: 40px 0;
  font-size: 14px;
}

.quick-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-tag {
  cursor: pointer;
}

.chat-input {
  display: flex;
  gap: 10px;
}
</style>
