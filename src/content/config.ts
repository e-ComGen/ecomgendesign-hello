import { defineCollection, z } from 'astro:content';

const packs = defineCollection({
  type: 'content',
  schema: z.object({
    // Identity (slug auto-derived from filename by Astro)
    title: z.string(),
    description: z.string(),
    category: z.string(), // food / ui / brand / dashboard / presentation / etc.

    // Pricing & links
    price_usd: z.number().default(0),
    is_free: z.boolean().default(false),  // free pack = lead magnet → Gumroad email gate
    gumroad_url: z.string().url(),
    github_url: z.string().url().optional(),

    // Inventory facts
    count: z.number(),
    variants: z.array(z.string()),
    total_files: z.number(),
    zip_size_kb: z.number().optional(),

    // Hero / cover assets (relative to /public)
    hero_image: z.string(),
    inventory_grids: z.array(z.string()),

    // Inline previews (filenames inside icons_dir, displayed in IconGrid)
    icons_dir: z.string(),    // e.g. "/packs/vegetable-icons-pack/thumbs"
    icons_ext: z.enum(['png', 'svg']).default('png'),
    // For multi-variant packs: subdir name within icons_dir to use for canonical
    // displays (IconGrid, TopPicks). VariantsExplainer uses all variants.
    default_variant: z.string().optional(),

    // Free hook: 4 icon names from `icons[]` given away as actual downloadable SVGs.
    // The real .svg files MUST live at /packs/<slug>/free/<name>.svg.
    // Required for paid packs; ignored for free packs (entire pack is free).
    free_picks: z.array(z.string()).default([]),
    icons: z.array(z.object({
      name: z.string(),       // filename without .svg
      label: z.string(),      // human readable
    })),

    // Marketing copy blocks
    hook: z.string(),         // 1-2 sentence problem/solution lead
    audience: z.array(z.object({
      role: z.string(),
      pain: z.string(),
    })),
    use_cases: z.array(z.object({
      title: z.string(),
      description: z.string(),
    })),
    top_picks: z.array(z.object({
      icon: z.string(),       // matches icons[].name
      note: z.string(),
    })),
    variants_explainer: z.array(z.object({
      name: z.string(),       // e.g. "mono-navy"
      when_to_use: z.string(),
    })),
    faq: z.array(z.object({
      q: z.string(),
      a: z.string(),
    })),

    // Cross-linking (slugs of related packs)
    related: z.array(z.string()).default([]),

    // Publish state
    pubDate: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { packs };
