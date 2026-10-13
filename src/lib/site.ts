/**
 * Site-wide facts for metadata, structured data and llms.txt — one place, so search engines
 * and AI tools get the same answer everywhere.
 */
export const SITE_URL = 'https://kitcheck.cc'
export const SITE_NAME = 'kitcheck.cc'

export const AUTHOR = {
  name: 'Ties Kuiper',
  url: `${SITE_URL}/about/`,
}

/** Bump when guide content changes: used as dateModified in Article structured data */
export const CONTENT_UPDATED = '2026-10-13'
export const CONTENT_PUBLISHED = '2026-10-12'

export const abs = (path: string) => `${SITE_URL}${path}`

const ORG_ID = `${SITE_URL}/#organization`
const SITE_ID = `${SITE_URL}/#website`
const AUTHOR_ID = `${SITE_URL}/#author`

/** WebSite + Organization + author on every page; page-specific nodes reference these by @id */
export function siteGraph(): object[] {
  return [
    {
      '@type': 'WebSite',
      '@id': SITE_ID,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      description: 'Free cycling kit calculator: what to wear on the bike, based on the real forecast and how hard you ride.',
      inLanguage: 'en',
      publisher: { '@id': ORG_ID },
    },
    {
      '@type': 'Organization',
      '@id': ORG_ID,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/favicon.svg`,
      founder: { '@id': AUTHOR_ID },
    },
    {
      '@type': 'Person',
      '@id': AUTHOR_ID,
      name: AUTHOR.name,
      url: AUTHOR.url,
      knowsAbout: ['Road cycling', 'Cycling clothing', 'Weather'],
    },
  ]
}

export function articleNode(opts: { url: string; headline: string; description: string; lang: string }): object {
  return {
    '@type': 'Article',
    '@id': `${opts.url}#article`,
    mainEntityOfPage: opts.url,
    headline: opts.headline,
    description: opts.description,
    inLanguage: opts.lang,
    datePublished: CONTENT_PUBLISHED,
    dateModified: CONTENT_UPDATED,
    author: { '@id': AUTHOR_ID },
    publisher: { '@id': ORG_ID },
    isPartOf: { '@id': SITE_ID },
    image: `${SITE_URL}/og.png`,
  }
}

export function breadcrumbNode(items: { name: string; url: string }[]): object {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
  }
}

export function faqNode(faq: { q: string; a: string }[]): object {
  return {
    '@type': 'FAQPage',
    mainEntity: faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }
}
