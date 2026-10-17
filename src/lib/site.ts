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

/** Bump when guide content changes: dateModified, the byline, sitemap lastmod; also the publish date of new pages */
export const CONTENT_UPDATED = '2026-10-17'
/** When the first guide pages (0–25°C) went live; pages added later use CONTENT_UPDATED */
export const CONTENT_PUBLISHED = '2026-10-12'

const DESCRIPTION = 'Free, brand-neutral cycling kit calculator for road cyclists: what to wear on the bike, based on the real forecast and how hard you ride.'

export const abs = (path: string) => `${SITE_URL}${path}`

const ORG_ID = `${SITE_URL}/#organization`
const SITE_ID = `${SITE_URL}/#website`
const AUTHOR_ID = `${SITE_URL}/#author`

/** WebSite + Organization + founder on every page; page-specific nodes reference these by @id */
export function siteGraph(): object[] {
  return [
    {
      '@type': 'WebSite',
      '@id': SITE_ID,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      alternateName: ['KitCheck', 'kitcheck'],
      description: DESCRIPTION,
      inLanguage: 'en',
      publisher: { '@id': ORG_ID },
    },
    {
      '@type': 'Organization',
      '@id': ORG_ID,
      name: SITE_NAME,
      alternateName: ['KitCheck', 'kitcheck'],
      description: DESCRIPTION,
      url: `${SITE_URL}/`,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png`, width: 512, height: 512 },
      founder: { '@id': AUTHOR_ID },
      foundingLocation: { '@type': 'Country', name: 'Netherlands' },
    },
    {
      '@type': 'Person',
      '@id': AUTHOR_ID,
      name: AUTHOR.name,
      url: AUTHOR.url,
      knowsAbout: ['Road cycling', 'Cycling clothing', 'Weather'],
      homeLocation: { '@type': 'Country', name: 'Netherlands' },
    },
  ]
}

export function articleNode(opts: { url: string; headline: string; description: string; lang: string; published?: string }): object {
  return {
    '@type': 'Article',
    '@id': `${opts.url}#article`,
    mainEntityOfPage: opts.url,
    headline: opts.headline,
    description: opts.description,
    inLanguage: opts.lang,
    datePublished: opts.published ?? CONTENT_UPDATED,
    dateModified: CONTENT_UPDATED,
    // The site, not a person, is the author: kitcheck.cc is a tool, not a blog
    author: { '@id': ORG_ID },
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
