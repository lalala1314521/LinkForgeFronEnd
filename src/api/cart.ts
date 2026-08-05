import { useAPI } from './request'
import type { CartItemResponse } from '@/types'

/** 购物车模块（需登录） */
export function useCartApi() {
  const { get, post, put, del } = useAPI()

  /** 购物车列表 */
  const getCart = () =>
    get<CartItemResponse[]>('/cart')

  /** 购物车商品总数（导航角标） */
  const getCount = () =>
    get<number>('/cart/count')

  /** 加入购物车 */
  const addCart = (productId: number, quantity: number) =>
    post<void>('/cart', { productId, quantity })

  /** 修改数量（1-999） */
  const updateQuantity = (id: number, quantity: number) =>
    put<void>(`/cart/${id}`, null, { params: { quantity } })

  /** 删除条目 */
  const removeItem = (id: number) =>
    del<void>(`/cart/${id}`)

  return { getCart, getCount, addCart, updateQuantity, removeItem }
}
