import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '../../../../src/components/AdminLayout'
import { AdminTable, TableColumn } from '../../../../src/components/AdminTable'
import { useAuth } from '../../../../src/auth/AuthProvider'
import api from '../../../../src/lib/api'
import styles from '../../../../styles/admin-table.module.css'

interface Course {
  id: string
  title: string
  description?: string
}

interface ImportError {
  line: number
  field: string
  message: string
}

const CourseImportExportPage: React.FC = () => {
  const { user } = useAuth()
  const router = useRouter()
  const { tenantId } = router.query

  // Tab state
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export')

  // Export state
  const [courses, setCourses] = useState<Course[]>([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [exportError, setExportError] = useState('')
  const [exportSuccess, setExportSuccess] = useState('')

  // Import state
  const [csvContent, setCsvContent] = useState('')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState('')
  const [importResult, setImportResult] = useState<any>(null)

  useEffect(() => {
    if (!tenantId) return
    loadCourses()
  }, [tenantId])

  const loadCourses = async () => {
    try {
      setCoursesLoading(true)
      const data = await api.getTenantCourses(tenantId as string)
      setCourses(Array.isArray(data) ? data : [])
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Failed to load courses')
    } finally {
      setCoursesLoading(false)
    }
  }

  const handleExportCourse = async (courseId: string) => {
    try {
      setExportError('')
      setExportSuccess('')
      
      const course = courses.find(c => c.id === courseId)
      if (!course) {
        setExportError('Course not found')
        return
      }

      const csv = await api.exportCourseAsCSV(tenantId as string, courseId)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${course.title}.csv`
      a.click()
      URL.revokeObjectURL(url)

      setExportSuccess(`✓ Exported "${course.title}"`)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Failed to export course')
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      setImportError('')
      const json = await api.downloadCSVTemplate()
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'course-template.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to download template')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.json')) {
        setImportError('Please select a JSON file')
        setImportFile(null)
        return
      }
      setImportFile(file)
      setImportError('')
      setImportSuccess('')
      setImportResult(null)
    }
  }

  const handleImportCourses = async () => {
    if (!importFile) {
      setImportError('Please select a JSON file')
      return
    }

    try {
      setImporting(true)
      setImportError('')
      setImportSuccess('')
      setImportResult(null)

      const text = await importFile.text()
      const result = await api.importCoursesFromCSV(tenantId as string, text)
      setImportResult(result)

      if (result.success) {
        setImportSuccess(`✓ Successfully imported ${result.importedCount} course(s)`)
        setImportFile(null)
        setCsvContent('')
        loadCourses()
      } else {
        // Show detailed errors if available
        let errorMsg = 'Import failed'
        if (result.errors && result.errors.length > 0) {
          const firstError = result.errors[0]
          errorMsg = `${firstError.field || 'Error'}: ${firstError.message || 'Unknown error'}`
        }
        setImportError(errorMsg)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to import courses'
      setImportError(errorMsg)
      console.error('Import error:', err)
    } finally {
      setImporting(false)
    }
  }

  if (!user) return <AdminLayout title="Course Import/Export"><div>Loading...</div></AdminLayout>
  if (user.role !== 'admin') return <AdminLayout title="Course Import/Export"><div>Unauthorized</div></AdminLayout>

  const courseColumns: TableColumn<Course>[] = [
    {
      key: 'title',
      header: 'Course Title',
      width: '60%'
    },
    {
      key: 'description',
      header: 'Description',
      width: '40%',
      render: (value) => value ? value.substring(0, 60) + '...' : '—'
    }
  ]

  return (
    <AdminLayout title="Course Import/Export">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {/* Header */}
        <div className={styles.header} style={{ marginBottom: '28px' }}>
          <div>
            <h1 style={{ margin: '0 0 4px 0', fontSize: 28, color: '#333' }}>Course Import/Export</h1>
            <p className={styles.subtitle}>Bulk import courses from CSV or export existing courses</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px' }}>
          <button
            onClick={() => {
              setActiveTab('export')
              setExportError('')
              setExportSuccess('')
            }}
            style={{
              padding: '8px 16px',
              background: activeTab === 'export' ? '#667eea' : '#f1f5f9',
              color: activeTab === 'export' ? 'white' : '#334155',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            📥 Export Courses
          </button>
          <button
            onClick={() => {
              setActiveTab('import')
              setImportError('')
              setImportSuccess('')
            }}
            style={{
              padding: '8px 16px',
              background: activeTab === 'import' ? '#667eea' : '#f1f5f9',
              color: activeTab === 'import' ? 'white' : '#334155',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            📤 Import Courses
          </button>
        </div>

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div>
            {exportError && (
              <div style={{
                background: '#fee2e2',
                color: '#991b1b',
                padding: '12px 16px',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                ✗ {exportError}
              </div>
            )}
            {exportSuccess && (
              <div style={{
                background: '#dcfce7',
                color: '#15803d',
                padding: '12px 16px',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {exportSuccess}
              </div>
            )}
            <p style={{ color: '#666', marginBottom: '16px', fontSize: '14px' }}>
              Select a course below to export it as a CSV file
            </p>
            <AdminTable
              columns={courseColumns}
              data={courses}
              loading={coursesLoading}
              emptyStateText="No courses available to export"
              actions={(course) => (
                <button
                  onClick={() => handleExportCourse(course.id)}
                  style={{
                    padding: '6px 12px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  Export
                </button>
              )}
            />
          </div>
        )}

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div>
            {importError && (
              <div style={{
                background: '#fee2e2',
                color: '#991b1b',
                padding: '12px 16px',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                ✗ {importError}
              </div>
            )}
            {importSuccess && (
              <div style={{
                background: '#dcfce7',
                color: '#15803d',
                padding: '12px 16px',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {importSuccess}
              </div>
            )}

            {/* Import Instructions */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#333' }}>How to Import Courses</h3>
              <ol style={{ color: '#666', fontSize: '14px', lineHeight: '1.6', paddingLeft: '20px' }}>
                <li>Click "Download Sample Template" below to see the JSON format</li>
                <li>Fill in your course data following the template structure</li>
                <li>Upload your JSON file using the form below</li>
              </ol>
              <button
                onClick={handleDownloadTemplate}
                style={{
                  padding: '8px 16px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                  marginTop: '12px'
                }}
              >
                📥 Download Sample Template
              </button>
            </div>

            {/* File Upload */}
            <div style={{
              background: 'white',
              border: '2px dashed #cbd5e1',
              borderRadius: '8px',
              padding: '24px',
              marginBottom: '20px'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 600,
                  color: '#333',
                  fontSize: '14px'
                }}>
                  Select JSON File to Import
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  style={{
                    padding: '8px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    width: '100%',
                    fontSize: '14px'
                  }}
                />
              </div>

              {importFile && (
                <div style={{
                  padding: '12px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '4px',
                  marginBottom: '16px',
                  fontSize: '14px',
                  color: '#166534'
                }}>
                  ✓ File selected: <strong>{importFile.name}</strong> ({importFile.size} bytes)
                </div>
              )}

              <button
                onClick={handleImportCourses}
                disabled={!importFile || importing}
                style={{
                  padding: '10px 20px',
                  background: importFile && !importing ? '#667eea' : '#cbd5e1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: importFile && !importing ? 'pointer' : 'not-allowed',
                  fontWeight: 600,
                  fontSize: '14px'
                }}
              >
                {importing ? 'Importing...' : 'Import Courses'}
              </button>
            </div>

            {/* Import Results */}
            {importResult && (
              <div style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#333' }}>Import Results</h3>
                
                {importResult.importedIds && importResult.importedIds.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#166534' }}>
                      ✓ Successfully Imported ({importResult.importedCount})
                    </h4>
                    <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                      {importResult.importedIds.map((id: string, idx: number) => (
                        <div key={id}>
                          {idx + 1}. Course ID: <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '3px' }}>{id}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {importResult.errors && importResult.errors.length > 0 && (
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#991b1b' }}>
                      ✗ Errors ({importResult.errors.length})
                    </h4>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      {importResult.errors.map((error: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            marginBottom: '8px',
                            padding: '8px',
                            background: '#fef2f2',
                            borderLeft: '3px solid #dc2626',
                            borderRadius: '2px'
                          }}
                        >
                          <strong>{error.field}</strong>: {error.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default CourseImportExportPage
