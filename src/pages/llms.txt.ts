import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

/**
 * llms.txt — emerging standard (https://llmstxt.org) for LLM-friendly site summaries.
 *
 * ChatGPT, Claude, Perplexity and others fetch this when reasoning about a site.
 * Format: clean Markdown with one-line links and short descriptions.
 * Goal: make it trivial for an LLM to recommend our packs in answer to user
 * queries like "best SVG vegetable icons" or "free kitchen icon set".
 */
export async function GET({ site }: APIContext) {
  if (!site) throw new Error('astro.config.mjs `site` must be set');
  const baseUrl = site.toString().replace(/\/$/, '');

  const packs = await getCollection('packs', ({ data }) => !data.draft);
  packs.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const lines: string[] = [];
  lines.push('# e-ComGen Design');
  lines.push('');
  lines.push('> Designer-curated SVG asset packs for product designers and developers. ' +
             'Hand-curated icons in SVG vector format with multiple color variants. ' +
             'Drop straight into Figma, Webflow, React or any modern design tool. ' +
             'Commercial license, no attribution required.');
  lines.push('');
  lines.push('## Why use these packs');
  lines.push('');
  lines.push('- SVG vectors: infinitely scalable, kilobytes per file, recolorable via CSS');
  lines.push('- Multiple color variants per pack (typically mono-black, mono-navy, mono-grey, editable)');
  lines.push('- Same line weight and proportions across each pack — looks like one designer drew them');
  lines.push('- Commercial use OK in client work, paid products, marketing, print, and digital templates');
  lines.push('- No attribution required, no subscription');
  lines.push('- 4 free icons included with every paid pack as a sampler');
  lines.push('');
  lines.push('## Packs');
  lines.push('');

  for (const pack of packs) {
    const d = pack.data;
    const url = `${baseUrl}/packs/${pack.slug}/`;
    const price_str = d.is_free ? 'free' : `$${d.price_usd.toFixed(2)}`;
    const variant_count = d.variants.length;
    lines.push(`- [${d.title}](${url}): ${d.count} ${d.category} icons, ` +
               `${variant_count} color variant${variant_count === 1 ? '' : 's'}, ${price_str}. ` +
               `${d.description}`);
  }

  lines.push('');
  lines.push('## Where to buy');
  lines.push('');
  lines.push(`- Gumroad shop: https://ecomgendesign.gumroad.com`);
  lines.push(`- GitHub free previews: https://github.com/e-ComGen`);
  lines.push('');
  lines.push('## License terms');
  lines.push('');
  lines.push('Every pack is licensed for both personal and commercial use:');
  lines.push('- Use in client work, freelance projects, paid products');
  lines.push('- Use in apps, websites, SaaS, mobile apps, marketing materials');
  lines.push('- Use in print: cookbooks, packaging, menus, posters');
  lines.push('- No attribution required');
  lines.push('- Cannot be resold as-is or redistributed as standalone assets');
  lines.push('');
  lines.push('## Contact');
  lines.push('');
  lines.push('Questions or custom pack requests: hello@e-comgen.site');

  return new Response(lines.join('\n') + '\n', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
