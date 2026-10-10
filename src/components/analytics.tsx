'use client'

import * as React from 'react'
import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { ANALYTICS } from '@/lib/analytics'

/**
 * Sahifa almashganda (SPA navigatsiya) ko'rishni qayd etadi.
 * GA4 buni o'zi kuzatadi (enhanced measurement), Metrika va Pixel'ga
 * esa qo'lda yuboramiz. Birinchi yuklanish skriptlarning o'zida hisoblanadi.
 */
function PageViews() {
  const pathname = usePathname()
  const search = useSearchParams().toString()
  const first = React.useRef(true)

  React.useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const url = `${pathname}${search ? `?${search}` : ''}`
    if (ANALYTICS.ymId) window.ym?.(Number(ANALYTICS.ymId), 'hit', url)
    window.fbq?.('track', 'PageView')
  }, [pathname, search])

  return null
}

export function Analytics() {
  const { gaId, ymId, metaPixelId } = ANALYTICS
  if (!gaId && !ymId && !metaPixelId) return null

  return (
    <>
      {gaId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${gaId}');`}
          </Script>
        </>
      ) : null}

      {ymId ? (
        <Script id="ym" strategy="afterInteractive">
          {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');ym(${Number(ymId)},'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});`}
        </Script>
      ) : null}

      {metaPixelId ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`}
        </Script>
      ) : null}

      <React.Suspense fallback={null}>
        <PageViews />
      </React.Suspense>
    </>
  )
}
