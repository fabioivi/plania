export const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: '2023-01-01T00:00:00Z',
}

export const mockAuthResponse = {
  token: 'mock-jwt-token-12345',
  user: mockUser,
}

export const mockLLMConfig = {
  id: '1',
  userId: '1',
  provider: 'gemini' as const,
  apiKey: '***',
  isActive: true,
  modelName: 'gemini-pro',
  createdAt: '2023-01-01T00:00:00Z',
}

export const mockLLMConfigs = [
  mockLLMConfig,
  {
    id: '2',
    userId: '1',
    provider: 'openai' as const,
    apiKey: '***',
    isActive: false,
    modelName: 'gpt-4',
    createdAt: '2023-01-02T00:00:00Z',
  },
]

export const mockCredentials = {
  login: {
    email: 'test@example.com',
    password: 'password123',
  },
  register: {
    name: 'New User',
    email: 'newuser@example.com',
    password: 'newpassword123',
  },
}
