import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a custom query client for tests
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries in tests
        gcTime: Infinity, // Keep data in cache indefinitely during tests
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  })

interface AllTheProvidersProps {
  children: React.ReactNode
}

// All providers wrapper
function AllTheProviders({ children }: AllTheProvidersProps) {
  const testQueryClient = createTestQueryClient()

  return (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  )
}

// Custom render function that includes all providers
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options })
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'

// Override the default render with our custom render
export { customRender as render }

// Utility to create a new query client for each test
export { createTestQueryClient }

// Utility to wait for loading states to resolve
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0))

// Utility to simulate user typing with delay
export const typeWithDelay = async (
  element: HTMLElement,
  text: string,
  delay = 50
) => {
  const { userEvent } = await import('@testing-library/user-event')
  const user = userEvent.setup({ delay })
  await user.type(element, text)
}
