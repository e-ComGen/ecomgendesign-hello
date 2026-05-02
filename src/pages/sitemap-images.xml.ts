import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

/**
 * Image sitemap (Google's <image:image> extension).
 * Lists every individual icon thumbnail per pack page. Each <image:image>
 * gives Google: loc (PNG URL), title, caption — used for ranking in
 * Google Images for queries like "broccoli SVG icon" or "<icon> vector".
 *
 * Reference:
 *   https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps
 */

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET({ site }: APIContext) {
  if (!site) throw new Error('astro.config.mjs `site` must be set');
  const baseUrl = site.toString().replace(/\/$/, '');

  const packs = await getCollection('packs', ({ data }) => !data.draft);

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
  lines.push('        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">');

  for (const pack of packs) {
    const d = pack.data;
    const page_url = `${baseUrl}/packs/${pack.slug}/`;

    // Collect all images for this page:
    //   - hero cover
    //   - inventory grids
    //   - every individual icon thumb
    const images: { loc: string; caption: string; title: string }[] = [];

    // Avoid awkward "icons icon" when category is generic
    const cat_phrase = (d.category && d.category !== 'icons') ? `${d.category} ` : '';

    images.push({
      loc: `${baseUrl}${d.hero_image}`,
      title: d.title,
      caption: d.description,
    });

    for (let i = 0; i < d.inventory_grids.length; i++) {
      images.push({
        loc: `${baseUrl}${d.inventory_grids[i]}`,
        title: `${d.title} — full grid (${i + 1}/${d.inventory_grids.length})`,
        caption: `Complete inventory of all ${d.count} ${cat_phrase}icons in the pack.`,
      });
    }

    // Each icon thumb (PNG): use the default_variant subdir if multi-variant, flat if single
    const variant_path = d.default_variant ? `/${d.default_variant}` : '';
    for (const icon of d.icons) {
      images.push({
        loc: `${baseUrl}${d.icons_dir}${variant_path}/${icon.name}.${d.icons_ext}`,
        title: `${icon.label} SVG icon`,
        caption: `${icon.label} ${cat_phrase}SVG icon — vector, scalable, commercial license. From the "${d.title}" pack by e-ComGen Design.`,
      });
    }

    // SVG file entries — Google indexes these as SVG specifically.
    // FREE pack: every icon × every variant under /svg/<variant>/<name>.svg
    // PAID pack: only 4 free_picks under /free/<variant>/<name>.svg
    if (d.is_free) {
      // For free packs we expose all variants — one SVG entry per icon × variant
      const variants_for_svg = d.default_variant
        ? d.variants.map(v => {
            const map: Record<string, string> = {
              'mono-black': '01-mono-black', 'mono-navy': '02-mono-navy',
              'mono-grey': '03-mono-grey', 'editable': '04-editable',
            };
            return map[v] ?? v;
          })
        : [''];  // single-variant flat
      for (const icon of d.icons) {
        for (const v_subdir of variants_for_svg) {
          const sub = v_subdir ? `/${v_subdir}` : '';
          images.push({
            loc: `${baseUrl}/packs/${pack.slug}/svg${sub}/${icon.name}.svg`,
            title: `${icon.label} ${v_subdir.replace(/^\d+-/, '')} SVG icon`.trim(),
            caption: `${icon.label} ${cat_phrase}SVG vector — free download, commercial license. Part of the "${d.title}" free pack.`,
          });
        }
      }
    } else if (d.free_picks.length > 0) {
      // Paid pack: 4 free_picks expose SVGs in all variants
      const variants_for_svg = d.default_variant
        ? d.variants.map(v => {
            const map: Record<string, string> = {
              'mono-black': '01-mono-black', 'mono-navy': '02-mono-navy',
              'mono-grey': '03-mono-grey', 'editable': '04-editable',
            };
            return map[v] ?? v;
          })
        : [''];
      for (const icon_name of d.free_picks) {
        const icon = d.icons.find(i => i.name === icon_name);
        const label = icon?.label ?? icon_name;
        for (const v_subdir of variants_for_svg) {
          const sub = v_subdir ? `/${v_subdir}` : '';
          images.push({
            loc: `${baseUrl}/packs/${pack.slug}/free${sub}/${icon_name}.svg`,
            title: `${label} ${v_subdir.replace(/^\d+-/, '')} SVG icon`.trim(),
            caption: `${label} ${cat_phrase}SVG vector — free sample from the "${d.title}" pack. Commercial license, no attribution.`,
          });
        }
      }
    }

    lines.push(`  <url>`);
    lines.push(`    <loc>${escapeXml(page_url)}</loc>`);
    for (const img of images) {
      lines.push(`    <image:image>`);
      lines.push(`      <image:loc>${escapeXml(img.loc)}</image:loc>`);
      lines.push(`      <image:title>${escapeXml(img.title)}</image:title>`);
      lines.push(`      <image:caption>${escapeXml(img.caption)}</image:caption>`);
      lines.push(`    </image:image>`);
    }
    lines.push(`  </url>`);
  }

  lines.push('</urlset>');

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
