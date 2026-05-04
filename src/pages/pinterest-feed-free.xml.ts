import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

/**
 * Pinterest RSS auto-publish feed — FREE packs only.
 * Pinterest Business → Bulk create Pins → connect this URL → assign to board "Free SVG Icon Packs".
 * Pinterest polls every ~24h and creates a Pin per <item>.
 *
 * Spec: https://help.pinterest.com/en/business/article/auto-publish-pins-from-your-rss-feed
 *  - RSS 2.0 (Media RSS extension for image)
 *  - <title> max 100 chars (pin title limit)
 *  - <description> max 500 chars (pin description limit)
 *  - <link> must be on claimed domain (e-comgen.site)
 *  - Image via <media:content url="..." medium="image"/>
 *  - <guid isPermaLink="false"> stable per pack so Pinterest doesn't re-pin on update
 */

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function clip(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + '…';
}

export async function GET({ site }: APIContext) {
  if (!site) throw new Error('astro.config.mjs `site` must be set');
  const baseUrl = site.toString().replace(/\/$/, '');

  const packs = await getCollection('packs', ({ data }) => !data.draft && data.is_free === true);

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:atom="http://www.w3.org/2005/Atom">');
  lines.push('  <channel>');
  lines.push(`    <title>e-comgen design — Free SVG Icon Packs</title>`);
  lines.push(`    <link>${baseUrl}/packs/</link>`);
  lines.push(`    <atom:link href="${baseUrl}/pinterest-feed-free.xml" rel="self" type="application/rss+xml"/>`);
  lines.push(`    <description>Free SVG icon packs for designers — commercial use, no attribution. Curated by e-comgen design.</description>`);
  lines.push(`    <language>en</language>`);

  for (const pack of packs) {
    const d = pack.data;
    const pageUrl = `${baseUrl}/packs/${pack.slug}/`;
    const imageUrl = `${baseUrl}${d.hero_image}`;

    const pinTitle = clip(d.title, 100);
    const variantsCount = (d.variants ?? []).length;
    const richDesc = [
      `${d.count} SVG icons · ${variantsCount} color variants · Figma & Sketch ready · Commercial use, no attribution required.`,
      '',
      d.description,
      '',
      `Free download: ${pageUrl}`,
    ].join('\n');
    const pinDesc = clip(richDesc, 500);

    const pubDate = (d.pubDate instanceof Date ? d.pubDate : new Date(d.pubDate)).toUTCString();

    lines.push(`    <item>`);
    lines.push(`      <title>${escapeXml(pinTitle)}</title>`);
    lines.push(`      <link>${escapeXml(pageUrl)}</link>`);
    lines.push(`      <description>${escapeXml(pinDesc)}</description>`);
    lines.push(`      <guid isPermaLink="false">e-comgen-pack-${pack.slug}</guid>`);
    lines.push(`      <pubDate>${pubDate}</pubDate>`);
    lines.push(`      <media:content url="${escapeXml(imageUrl)}" medium="image" type="image/png"/>`);
    lines.push(`    </item>`);
  }

  lines.push('  </channel>');
  lines.push('</rss>');

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
