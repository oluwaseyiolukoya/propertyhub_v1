import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { CurrencyProvider } from './lib/CurrencyContext.tsx'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/query-client.ts'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </CurrencyProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)


