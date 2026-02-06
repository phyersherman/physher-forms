import type { NextPage, GetServerSideProps } from 'next'
import Head from 'next/head'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../src/auth/AuthProvider'

const Home: NextPage = () => {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user === null) {
      router.replace('/login')
    } else if (user && user.role === 'admin') {
      router.replace('/admin/tenants')
    }
  }, [user, router])

  return (
    <>
      <Head>
        <title>Tenant Portal</title>
      </Head>
      <main className="min-h-screen flex items-center justify-center">
        {!user ? (
          <h1 className="text-2xl font-semibold">Loading…</h1>
        ) : (
          <h1 className="text-2xl font-semibold">Welcome to the Tenant Portal</h1>
        )}
      </main>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  // Example: server can fetch tenant theme via host (req.headers.host)
  // For now pass a dummy theme
  const theme = { primaryColor: '#0ea5a4', logoUrl: '' }
  return { props: { tenantTheme: theme } }
}

export default Home
