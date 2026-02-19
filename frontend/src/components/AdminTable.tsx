import React from 'react'
import styles from '../../styles/admin-table.module.css'

export interface TableColumn<T> {
  key: keyof T | string
  header: string
  width?: string
  render?: (value: any, item: T) => React.ReactNode
}

export interface AdminTableProps<T extends { id: string }> {
  columns: TableColumn<T>[]
  data: T[]
  loading: boolean
  isEmpty?: boolean
  emptyStateText?: string
  emptyStateAction?: React.ReactNode
  rowKey?: keyof T
  onRowClick?: (item: T) => void
  actions?: (item: T) => React.ReactNode
}

/**
 * Reusable AdminTable component for displaying tabular data
 * Supports custom columns, rendering, and actions
 */
function AdminTableComponent<T extends { id: string }>(
  {
    columns,
    data,
    loading,
    isEmpty = false,
    emptyStateText = 'No data available',
    emptyStateAction,
    rowKey = 'id',
    onRowClick,
    actions,
  }: AdminTableProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  if (loading) {
    return <div style={{ padding: '24px' }}>Loading...</div>
  }

  if (isEmpty || data.length === 0) {
    return (
      <div className={styles.empty}>
        <p>{emptyStateText}</p>
        {emptyStateAction}
      </div>
    )
  }

  return (
    <div className={styles.tableWrapper} ref={ref}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} style={{ width: col.width }}>
                {col.header}
              </th>
            ))}
            {actions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={String(item[rowKey as keyof T])}
              onClick={() => onRowClick?.(item)}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {columns.map((col) => {
                const value = item[col.key as keyof T]
                return (
                  <td key={String(col.key)}>
                    {col.render ? col.render(value, item) : String(value || '—')}
                  </td>
                )
              })}
              {actions && <td className={styles.actions}>{actions(item)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const AdminTable = React.forwardRef(
  AdminTableComponent
) as <T extends { id: string }>(
  props: AdminTableProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement
