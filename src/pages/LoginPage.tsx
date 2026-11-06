import type * as React from 'react'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.ts'

const invalidCredentialsMessage = 'Неверный email или пароль'
const genericAuthErrorMessage = 'Не удалось войти. Попробуйте ещё раз.'

const isInvalidCredentialsError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false
  }

  if ('code' in error && error.code === 'invalid_credentials') {
    return true
  }

  if ('message' in error && typeof error.message === 'string') {
    const message = error.message.toLowerCase()

    return (
      message.includes('invalid login credentials') ||
      message.includes('invalid email or password')
    )
  }

  return false
}

const LoginPage: React.FC = () => {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (submitting) {
      return
    }

    setErrorMessage(null)
    setSubmitting(true)

    void signIn(email.trim(), password).catch((error: unknown) => {
      setErrorMessage(
        isInvalidCredentialsError(error) ? invalidCredentialsMessage : genericAuthErrorMessage,
      )
      setSubmitting(false)
    })
  }

  return (
    <section className="w-full rounded-xl bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-bold text-slate-900">Вход в Mini CRM</h1>
      <p className="mt-3 text-slate-600">Войдите, используя выданные вам учётные данные</p>

      <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            disabled={submitting}
            className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
            onChange={(event) => {
              setEmail(event.target.value)
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            Пароль
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            disabled={submitting}
            className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
            onChange={(event) => {
              setPassword(event.target.value)
            }}
          />
        </div>

        {errorMessage ? (
          <p className="text-sm text-red-600" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {submitting ? 'Входим...' : 'Войти'}
        </button>
      </form>
    </section>
  )
}

export default LoginPage
