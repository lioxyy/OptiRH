import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from './context/auth-context'
import { AppRouter } from './app-router'
import { ErrorBoundary } from './components/error-boundary'
import { Toaster } from './components/ui/sonner'
import './index.css'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <AppRouter />
            <Toaster />
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </QueryClientProvider>
  </ThemeProvider>,
)
