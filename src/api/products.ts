import { useAPI } from './request'
import type {
  Product,
  ProductCreateRequest,
  ProductUpdateRequest,
  ProductQueryParams,
  PageResult,
} from '@/types'

/** 商品模块：GET 登录即可；写操作（POST/PUT/DELETE）ADMIN-only（后端 403 拦截兜底） */
export function useProductApi() {
  const { get, post, put, del } = useAPI()

  const getProducts = (params?: ProductQueryParams) =>
    get<PageResult<Product>>('/products', params as Record<string, unknown>)

  const getProductById = (id: number) =>
    get<Product>(`/products/${id}`)

  const createProduct = (data: ProductCreateRequest) =>
    post<number>('/products', data)

  const updateProduct = (id: number, data: ProductUpdateRequest) =>
    put<void>(`/products/${id}`, data)

  /** 逻辑下架（status=OFF_SALE），不物理删除 */
  const deleteProduct = (id: number) =>
    del<void>(`/products/${id}`)

  return {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
  }
}
