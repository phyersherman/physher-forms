import React, { createContext, useContext, useEffect } from 'react'

export type ThemeConfig = {
  primaryColor?: string
  secondaryColor?: string
  logoUrl?: string
}

const ThemeContext = createContext<ThemeConfig | undefined>(undefined)

export const ThemeProvider: React.FC<{ initialTheme?: ThemeConfig; children: React.ReactNode }> = ({ initialTheme, children }) => {
  useEffect(() => {
    if (initialTheme) applyTheme(initialTheme)
  }, [initialTheme])

  return <ThemeContext.Provider value={initialTheme}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)

export const applyTheme = (theme: ThemeConfig) => {
  const root = document.documentElement
  if (theme.primaryColor) root.style.setProperty('--color-primary', theme.primaryColor)
  if (theme.secondaryColor) root.style.setProperty('--color-secondary', theme.secondaryColor)
  if (theme.logoUrl) root.style.setProperty('--logo-url', `url(${theme.logoUrl})`)
}

export default ThemeProvider
