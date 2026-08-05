import { useAPI } from './request'

/** 智能客服（需登录） */
export function useSupportApi() {
  const { post } = useAPI()

  /** 发送消息，返回客服回复 */
  const chat = (message: string) =>
    post<{ reply: string }>('/support/chat', { message })

  return { chat }
}
