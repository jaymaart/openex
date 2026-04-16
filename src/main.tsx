import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ipcLink } from 'electron-trpc/renderer'
import { trpc } from './lib/trpc'
import { App } from './App'
import './renderer.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
})

const trpcClient = trpc.createClient({
  links: [ipcLink()]
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  </React.StrictMode>
)
