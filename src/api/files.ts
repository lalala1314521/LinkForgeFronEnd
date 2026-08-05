import { useAPI } from './request'
import type { UploadResult } from '@/types'

/** 文件上传模块：POST /api/files/upload（ADMIN-only，后端 403 拦截兜底） */
export function useFileApi() {
  const { post } = useAPI()

  /**
   * 上传图片（jpg/jpeg/png/webp，≤5MB），返回相对 URL /uploads/&lt;文件名&gt;
   * 注意：不手动设置 Content-Type，axios 对 FormData 自动生成 multipart boundary
   */
  const upload = (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return post<UploadResult>('/files/upload', fd, {
      headers: { 'Content-Type': undefined },
    })
  }

  return { upload }
}
