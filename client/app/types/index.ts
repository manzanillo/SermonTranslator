export interface User {
  id: number
  name: string
  email: string
  role: 'imam' | 'listener'
  createdAt: string
}

export interface Translation {
  id: number
  originalText: string
  translatedText: string
  language: string
  createdAt: string
}

export interface Session {
  id: number
  imamId: number
  imam: User
  title: string
  description?: string
  isActive: boolean
  createdAt: string
  participants: User[]
  translations: Translation[]
}
