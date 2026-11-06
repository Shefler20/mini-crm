export type UserRole = 'manager' | 'executor'

export interface UserProfile {
  id: string
  full_name: string
  role: UserRole
}
