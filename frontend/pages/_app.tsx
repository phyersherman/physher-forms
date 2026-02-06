import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { ThemeProvider } from '../src/theme/ThemeProvider'
import { AuthProvider } from '../src/auth/AuthProvider'
import ProtectedRoute from '../src/auth/ProtectedRoute'

export default function App({ Component, pageProps }: AppProps) {
  // pageProps.tenantTheme can be provided by getServerSideProps in tenant pages
  return (
    <ThemeProvider initialTheme={pageProps.tenantTheme}>
      <AuthProvider>
        <ProtectedRoute>
          <Component {...pageProps} />
        </ProtectedRoute>
      </AuthProvider>
    </ThemeProvider>
  )
}
