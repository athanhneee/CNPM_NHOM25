import { useDataStore } from '@/app/store/data.store'
import { apiRequest } from '@/lib/api-client'
import type { WishRequest } from '@/types/course'

type BackendWishRequest = Omit<WishRequest, 'createdAt'> & {
  createdAt?: string | Date | null
}

interface WishQuery {
  studentId?: string
  semesterId?: string
  courseCode?: string
  status?: WishRequest['status']
}

function normalizeIso(value: string | Date | null | undefined, fallback = new Date().toISOString()) {
  if (!value) {
    return fallback
  }

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString()
}

function normalizeWish(wish: BackendWishRequest): WishRequest {
  const normalizedWish: WishRequest = {
    id: wish.id,
    studentId: wish.studentId,
    semesterId: wish.semesterId,
    courseCode: wish.courseCode,
    reason: wish.reason,
    createdAt: normalizeIso(wish.createdAt),
    status: wish.status,
  }

  if (wish.preferredGroup) {
    normalizedWish.preferredGroup = wish.preferredGroup
  }

  return normalizedWish
}

function queryPath(basePath: string, query: WishQuery = {}) {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value) {
      params.set(key, value)
    }
  })

  const queryString = params.toString()
  return queryString ? `${basePath}?${queryString}` : basePath
}

function syncWishes(wishes: WishRequest[]) {
  useDataStore.setState({ wishes })
}

function upsertWish(wish: WishRequest) {
  useDataStore.setState((state) => {
    const byId = new Map(state.wishes.map((item) => [item.id, item]))
    byId.set(wish.id, wish)
    return { wishes: Array.from(byId.values()).sort((left, right) => right.createdAt.localeCompare(left.createdAt)) }
  })
}

export const wishService = {
  async listWishes(query: WishQuery = {}) {
    const wishes = (await apiRequest<BackendWishRequest[]>(queryPath('/wishes', query))).map(normalizeWish)
    if (Object.values(query).some(Boolean)) {
      useDataStore.setState((state) => ({
        wishes: [
          ...state.wishes.filter((wish) => {
            if (query.studentId && wish.studentId === query.studentId) return false
            if (!query.studentId && query.semesterId && wish.semesterId === query.semesterId) return false
            if (!query.studentId && !query.semesterId && query.courseCode && wish.courseCode === query.courseCode) return false
            if (!query.studentId && !query.semesterId && !query.courseCode && query.status && wish.status === query.status) {
              return false
            }
            return true
          }),
          ...wishes,
        ],
      }))
    } else {
      syncWishes(wishes)
    }
    return wishes
  },

  async createWishRequest(payload: Omit<WishRequest, 'id' | 'createdAt' | 'status'>) {
    const wish = normalizeWish(
      await apiRequest<BackendWishRequest>('/wishes', {
        method: 'POST',
        body: payload,
      }),
    )
    upsertWish(wish)
    return wish
  },

  async cancelWishRequest(wishId: string) {
    const wish = normalizeWish(
      await apiRequest<BackendWishRequest>(`/wishes/${wishId}/cancel`, {
        method: 'POST',
      }),
    )
    upsertWish(wish)
    return wish
  },

  async updateWishStatus(wishId: string, status: WishRequest['status']) {
    const wish = normalizeWish(
      await apiRequest<BackendWishRequest>(`/wishes/${wishId}/status`, {
        method: 'PATCH',
        body: { status },
      }),
    )
    upsertWish(wish)
    return wish
  },
}
