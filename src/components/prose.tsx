import type * as React from 'react'
import { Link } from '@/i18n/client'
import { fmt } from '@/i18n/format'
import { getMessages } from '@/i18n/server'
import type { ProseBlock } from '@/i18n/messages/uz/pages'

/**
 * Lug'atdagi matn ichida oddiy belgilash: **qalin** va [matn](/yo'l).
 * Ichki havolalar joriy tilga moslanadi, tashqi/mailto — o'zgarmaydi.
 */
function Inline({ text }: { text: string }) {
  const parts: React.ReactNode[] = []
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    if (m[1]) parts.push(<strong key={key++}>{m[1]}</strong>)
    else if (m[3].startsWith('/')) parts.push(<Link key={key++} href={m[3]}>{m[2]}</Link>)
    else parts.push(<a key={key++} href={m[3]}>{m[2]}</a>)
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}

/** Lug'atdagi bloklar ro'yxatini chizadi; `vars` — {name}, {email} kabi qiymatlar */
export function ProseBlocks({
  blocks,
  vars = {},
}: {
  blocks: readonly ProseBlock[]
  vars?: Record<string, string | number>
}) {
  return (
    <>
      {blocks.map((b, i) => {
        if ('h2' in b) return <h2 key={i}><Inline text={fmt(b.h2, vars)} /></h2>
        if ('h3' in b) return <h3 key={i}><Inline text={fmt(b.h3, vars)} /></h3>
        if ('ul' in b)
          return (
            <ul key={i}>
              {b.ul.map((li, j) => (
                <li key={j}><Inline text={fmt(li, vars)} /></li>
              ))}
            </ul>
          )
        return <p key={i}><Inline text={fmt(b.p, vars)} /></p>
      })}
    </>
  )
}

/** Matnli sahifalar uchun umumiy tipografiya */
export async function Prose({
  title,
  updatedAt,
  children,
}: {
  title: string
  updatedAt?: string
  children: React.ReactNode
}) {
  const t = (await getMessages()).pages.common
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="text-[26px] font-bold leading-tight tracking-tight text-text sm:text-3xl">
        {title}
      </h1>
      {updatedAt ? (
        <p className="mt-2 text-[13px] text-subtle">{fmt(t.updated, { date: updatedAt })}</p>
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
