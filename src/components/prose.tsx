import type * as React from 'react'

/** Matnli sahifalar uchun umumiy tipografiya */
export function Prose({
  title,
  updatedAt,
  children,
}: {
  title: string
  updatedAt?: string
  children: React.ReactNode
}) {
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="text-[26px] font-bold leading-tight tracking-tight text-text sm:text-3xl">
        {title}
      </h1>
      {updatedAt ? (
        <p className="mt-2 text-[13px] text-subtle">Oxirgi yangilanish: {updatedAt}</p>
      ) : null}
      <div
        className="mt-6 space-y-4 text-[15px] leading-relaxed text-muted
          [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline
          [&_h2]:mt-8 [&_h2]:text-[19px] sm:[&_h2]:mt-9 sm:[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-text
          [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-text
          [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5
          [&_strong]:font-semibold [&_strong]:text-text
          [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5"
      >
        {children}
      </div>
    </article>
  )
}
