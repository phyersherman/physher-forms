import { useState, useEffect } from 'react'

/**
 * Custom hook for managing block configuration with JSON parsing and syncing
 * Handles:
 * - Parsing JSON config strings into typed objects
 * - Syncing config changes with parent
 * - Merging with default values
 */
export function useBlockConfig<T extends Record<string, any>>(
  configJson: string | undefined,
  defaults: T,
  blockId: string,
  onUpdate: (data: { config?: string }) => void
): [T, (updates: Partial<T>) => void, boolean] {
  const [config, setConfig] = useState<T>(defaults)
  const [isDirty, setIsDirty] = useState(false)

  // Parse config from JSON when block config changes
  useEffect(() => {
    if (configJson) {
      try {
        const parsed = JSON.parse(configJson)
        setConfig({ ...defaults, ...parsed })
      } catch {
        // Invalid JSON, use defaults
        setConfig(defaults)
      }
    } else {
      setConfig(defaults)
    }
    setIsDirty(false)
  }, [blockId, configJson])

  const updateConfig = (updates: Partial<T>) => {
    const newConfig = { ...config, ...updates }
    setConfig(newConfig)
    setIsDirty(true)
    onUpdate({ config: JSON.stringify(newConfig) })
  }

  return [config, updateConfig, isDirty]
}
