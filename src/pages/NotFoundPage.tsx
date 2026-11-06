import type * as React from 'react'

const NotFoundPage: React.FC = () => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-10">
      <section className="w-full max-w-xl rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold tracking-wide text-blue-600">404</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Страница не найдена</h1>
        <p className="mt-3 text-slate-600">
          Запрошенный адрес не существует. Проверьте ссылку или вернитесь к списку объектов.
        </p>
      </section>
    </main>
  )
}

export default NotFoundPage
