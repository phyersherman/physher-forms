import { useState, useEffect, useCallback } from 'react'

export interface UseTableDataProps<T> {
  fetchFn: () => Promise<T[]>
  onDeleteFn?: (id: string) => Promise<void>
  onDeleteSuccess?: (id: string) => void
  deps?: any[]
}

export interface UseTableDataReturn<T> {
  data: T[]
  loading: boolean
  error: string
  setData: (data: T[] | ((prev: T[]) => T[])) => void
  deleteItem: (id: string) => Promise<void>
  refetch: () => Promise<void>
}

/**
 * Custom hook for managing table data loading and basic CRUD operations
 * Handles loading states, error handling, and delete functionality
 */
export function useTableData<T extends { id: string }>({
  fetchFn,
  onDeleteFn,
  onDeleteSuccess,
  deps = [],
}: UseTableDataProps<T>): UseTableDataReturn<T> {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refetch = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await fetchFn()
      setData(Array.isArray(result) ? result : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [fetchFn])

  useEffect(() => {
    refetch()
  }, deps)

  const deleteItem = useCallback(
    async (id: string) => {
      if (!onDeleteFn) {
        throw new Error('Delete function not provided')
      }

      try {
        await onDeleteFn(id)
        setData((prev) => prev.filter((item) => item.id !== id))
        onDeleteSuccess?.(id)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete item'
        setError(message)
        throw err
      }
    },
    [onDeleteFn, onDeleteSuccess]
  )

  return {
    data,
    loading,
    error,
    setData,
    deleteItem,
    refetch,
  }
}
