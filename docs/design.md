# + Sustentável — Design System

## Overview

+ Sustentável is a reverse-logistics platform for used cooking oil, with a warm-but-credible identity that spans three surfaces: a public landing page, the Gestor dashboard, and the resident app. Marketing surfaces anchor in a clean Areia/white canvas with deep-green Verde Profundo typographic emphasis — the voice is optimistic, clear and never guilt-tripping, always celebrating the simple gesture ("cada litro soma"). Each of the four brand pillars gets its own vibrant gradient identity card: Ambiental in Verde +, Social in Amarelo Soma, Educativo in Azul Água, Comunitário in Verde Floresta. Together these tiles read like a set of impact cards laid out on the homepage — each one declaring a facet of the same idea: turning a pollutant into value.

Poppins anchors display and headings (its rounded-geometric character carries the brand's warmth and optimism from 80px heroes down to card titles), while Inter carries body copy and the dense dashboard/app UI (chosen for screen legibility at small sizes on stickers, tables and forms). Buttons are universally pill-shaped (`rounded-full`) with a sharp two-tier system: deep-green-pill primary (the dominant CTA) and outline-pill secondary. Cards split into two distinct families: vibrant gradient pillar showcases (32px corner softening) and quiet white content cards (16px corner softening).

**Key Characteristics:**
- Grounded two-tone base — deep green ({colors.primary}) and white ({colors.canvas}) — opened up by saturated pillar-color gradient cards
- Distinct pillar-color encoding: each of the four value pillars has its own brand color (Verde + Ambiental, Amarelo Soma Social, Azul Água Educativo, Verde Floresta Comunitário)
- Poppins for display/headings, Inter for body and UI; never a third typeface
- Pill-shaped buttons ({rounded.full}) and pill-shaped tabs everywhere; rectangular forms only inside data tables and dense dashboard views
- Hero typography uses tight 1.10 line-height with -1.5px/-2px letter-spacing for impact
- Dashboard surfaces use a 3-column layout: left sidebar nav, center content, right detail/TOC rail
- Deep-green promo banners ({colors.primary}) above the nav for time-bound campaign moments

## Colors

> Representative surfaces: maissustentavel.com/ (landing), app.maissustentavel.com/painel (Gestor dashboard), app.maissustentavel.com/impacto (resident app), /adesao (plans for condomínios/escolas/empresas). Token coverage is intended to be identical across all surfaces.
> Token keys are code identifiers; display names, hex values and color descriptors follow the + Sustentável palette.

### Brand & Accent
- **Verde +** (`{colors.brand-verde}` · `#0E9E6E`): Signature high-impact accent. Used on the Ambiental pillar card, hero bands, promo CTA strips, and "NOVO"/"Ativo" badges. Carries the brand's most attention-grabbing energy.
- **Amarelo Soma** (`{colors.brand-amarelo}` · `#F4B53F`): Social pillar identity; warmth, reward and the R$1-per-liter social moment. Always paired with dark text.
- **Azul Água** (`{colors.brand-azul}` · `#1C8FB5`): Educativo pillar identity and primary água accent across the system.
- **Azul Água Fundo** (`{colors.brand-azul-fundo}` · `#12729A`): Form-control activation, link emphasis.
- **Azul Água 700** (`{colors.brand-azul-700}` · `#0E5C7D`): Documentation/help tag and reference text color.
- **Ciano Água** (`{colors.brand-ciano}` · `#5FC3D6`): Atmospheric wash for pillar gradients and decorative fills.
- **Azul Água 200** (`{colors.brand-azul-200}` · `#D6EBF3`): Code badges, info-tag backgrounds.
- **Verde Floresta** (`{colors.brand-floresta}` · `#0B6B4F`): Comunitário pillar identity; deep-green gradient mate for Verde + and Amarelo Soma cards.

### Core
- **Verde Profundo** (`{colors.primary}` · `#11332E`): Dominant CTA, promo banners, footer and dark pillar card — the brand's near-black anchor.
- **On Primary** (`{colors.on-primary}` · `#FFFFFF`): Text and icons on `{colors.primary}` surfaces.
- **On Dark** (`{colors.on-dark}` · `#FFFFFF`): Text on vibrant and dark cards.
- **Footer** (`{colors.footer-bg}` · `#0D2A24`): Dense dark footer canvas.

### Surface
- **Branco** (`{colors.canvas}` · `#FFFFFF`): Primary page background and card surface.
- **Areia** (`{colors.surface}` · `#F6F8F2`): Subtle section backgrounds, search-pill rest, sidebar-nav active state.
- **Areia Suave** (`{colors.surface-soft}` · `#EEF3EC`): Quieter section divisions.
- **Traço** (`{colors.hairline}` · `#DCE5DF`): 1px input border and primary divider.
- **Traço Suave** (`{colors.hairline-soft}` · `#E9EFEA`): Quieter table-row divider and secondary section break.

### Text
- **Verde Profundo** (`{colors.ink}` · `#11332E`): Primary headline and CTA text — the brand's near-black anchor.
- **Verde Profundo Forte** (`{colors.ink-strong}` · `#08201B`): Deepest tone used in promo banners and hero displays for maximum contrast.
- **Grafite Verde** (`{colors.charcoal}` · `#2A4C45`): Body text on light surfaces.
- **Ardósia** (`{colors.slate}` · `#4A6B62`): Secondary text, metadata.
- **Aço** (`{colors.steel}` · `#6E8880`): Tertiary text, table headers, sidebar inactive items.
- **Pedra** (`{colors.stone}` · `#8AA097`): Muted captions and tab inactive labels.
- **Esmaecido** (`{colors.muted}` · `#A7BBB2`): Footer link text and de-emphasized labels.

### Semantic
- **Success Background** (`{colors.success-bg}` · `#E3F5EC`): Pale-green wash for success badges and confirmations.
- **Success Text** (`{colors.success-text}` · `#0B6E4C`): Deep-green ink for success badge labels.
- Error tones derive from a `#d45656` red used in input border error states (functional token, kept outside the brand palette).

> **Pares acessíveis:** texto pequeno sempre em `{colors.ink}` sobre fundo claro (contraste ~13:1); branco sobre `{colors.brand-verde}` ou `{colors.brand-azul}` apenas em tamanhos grandes; sobre `{colors.brand-amarelo}` (Amarelo Soma) use sempre texto escuro, nunca branco.

## Typography

### Font Family
**Poppins** (display / headings): Rounded geometric sans-serif. Used for hero displays, section openers, headings and card titles. Fallbacks: Inter, Helvetica Neue, Arial. Weights 500/600.

**Inter** (body / UI): Neutral, highly legible sans-serif. Used for body copy, tables, forms, navigation and all dense dashboard/app surfaces down to 12px micro labels. Fallbacks: Helvetica Neue, Arial. Weights 400/500/600.

The pairing carries the brand's dual audience in a single system: Poppins brings warmth and optimism to the display sizes that face the resident and the landing page (where -1.5px/-2px letter-spacing keeps large headlines tight), while Inter brings the institutional legibility that the Gestor dashboard and small print on stickers require. Neither face uses an italic in the brand deployment — emphasis comes from weight.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.hero-display}` | 80px | 600 | 1.10 | -2px | Landing hero ("Cada litro soma") — Poppins |
| `{typography.display-lg}` | 56px | 600 | 1.10 | -1.5px | Section openers, pillar-card wordmarks — Poppins |
| `{typography.heading-lg}` | 40px | 600 | 1.20 | -1px | Sub-page headlines ("Nosso Impacto", "Pontos de Coleta") — Poppins |
| `{typography.heading-md}` | 32px | 600 | 1.25 | -0.5px | Subsection headers ("Como funciona") — Poppins |
| `{typography.heading-sm}` | 24px | 600 | 1.30 | 0 | Card titles, feature headers — Poppins |
| `{typography.card-title}` | 20px | 600 | 1.40 | 0 | Pillar-card titles, feature-tile headers — Poppins |
| `{typography.subtitle}` | 18px | 500 | 1.50 | 0 | Section subtitles, lead body — Inter |
| `{typography.body-md}` | 16px | 400 | 1.50 | 0 | Primary body text — Inter |
| `{typography.body-md-bold}` | 16px | 700 | 1.50 | 0 | Body emphasis — Inter |
| `{typography.body-sm}` | 14px | 400 | 1.50 | 0 | Secondary body, table cells, navigation — Inter |
| `{typography.body-sm-medium}` | 14px | 500 | 1.50 | 0 | Active sidebar nav, button labels — Inter |
| `{typography.caption}` | 13px | 400 | 1.70 | 0 | Captions, fine print — Inter |
| `{typography.caption-bold}` | 13px | 600 | 1.50 | 0 | Badge labels, table-header text — Inter |
| `{typography.micro}` | 12px | 400 | 1.50 | 0 | Footer microcopy, chip labels — Inter |
| `{typography.button-md}` | 14px | 600 | 1.40 | 0 | Pill button labels — Inter |

### Principles
- **Tight hero leading** (1.10) and negative letter-spacing on Poppins display sizes create a confident, modern headline treatment for the landing page.
- **Generous body leading** (1.50) keeps long-form content and dashboards comfortable; captions push to 1.70 for fine print clarity.
- **Weight discipline:** Poppins 500/600 for display and headings; Inter 400 (body), 500 (medium emphasis), 600 (buttons/strong labels), 700 (strong inline emphasis).
- **Two-typeface pairing** — Poppins for display/headings, Inter for body/UI. Never introduce a third typeface. Code samples use a system monospace fallback only.

## Layout

### Spacing System
- **Base unit**: 4px (8px primary increment).
- **Tokens**: `{spacing.xxs}` (4px) · `{spacing.xs}` (8px) · `{spacing.sm}` (12px) · `{spacing.md}` (16px) · `{spacing.lg}` (20px) · `{spacing.xl}` (24px) · `{spacing.xxl}` (32px) · `{spacing.xxxl}` (40px) · `{spacing.section-sm}` (48px) · `{spacing.section}` (64px) · `{spacing.section-lg}` (80px) · `{spacing.hero}` (96px).
- **Section rhythm**: Landing separates at `{spacing.hero}` (96px) above-fold, then `{spacing.section-lg}` (80px) below; dashboard tightens to `{spacing.section}` (64px); table rows compress to `{spacing.md}` (16px).
- **Card internal padding**: Vibrant pillar cards use `{spacing.xxl}` (32px); content cards use `{spacing.lg}–{spacing.xl}` (20–24px); promo strips expand to `{spacing.section}` (64px).

### Grid & Container
- Landing uses a 1280px max-width with 32px gutters.
- Homepage pillar matrix renders as a 4-column row of 32px-rounded gradient cards, each ~280–320px wide.
- Feature matrix below uses a 4-column grid with 16px-rounded white cards.
- Dashboard surfaces use a 3-column layout: left sidebar nav (~220px), center content (~720px max-width), right detail rail (~180px). Sidebar persists on desktop; collapses to drawer below 1024px.
- Adesão / plans pages use 2-column tabs above a 3-column tier card grid.

### Whitespace Philosophy
Landing pages give the pillar cards and impact numbers generous breathing room — `{spacing.hero}` (96px) above-the-fold creates visual oxygen for the 80px hero display. Inside the dashboard, whitespace tightens: section gaps drop to `{spacing.xxl}` (32px), table rows pack down to `{spacing.md}` (16px), and the sidebar nav uses `{spacing.xs}` (8px) vertical rhythm.

## Elevation & Depth

The system runs predominantly flat. Elevation is reserved for sticky panels, dropdowns, and the rare floating CTA.

| Level | Treatment | Use |
|---|---|---|
| 0 (flat) | No shadow; `{colors.hairline}` border | Default cards, table rows, form inputs |
| 1 (subtle) | `rgba(0, 0, 0, 0.04) 0px 1px 2px 0px` | Recommendation tiles, hover-elevated tiles |
| 2 (card) | `rgba(0, 0, 0, 0.08) 0px 4px 6px 0px` | Standard feature cards, dropdowns |
| 3 (atmospheric) | `rgba(0, 0, 0, 0.08) 0px 0px 22px 0px` | Diffuse glow on featured pillar cards |
| 4 (modal) | `rgba(36, 36, 36, 0.08) 0px 12px 16px -4px` | Modals, confirmation dialogs, sticky panels |

### Decorative Depth
- The vibrant gradient pillar cards carry their own atmospheric depth via internal radial gradients — no shadow needed; the color does the work.
- Brand-tinted shadows (`rgba(11, 107, 79, 0.16) 0px 0px 15px`) appear under Verde-Floresta-themed cards for subtle ambient lift.
- Subtle water-ripple line textures may appear inside pillar cards as decoration; these are not formalized as system tokens.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 4px | Code chips, micro-controls |
| `{rounded.sm}` | 6px | Compact controls, table cells |
| `{rounded.md}` | 8px | Inputs, secondary buttons, search pill |
| `{rounded.lg}` | 12px | Content cards, recommendation tiles |
| `{rounded.xl}` | 16px | Standard feature cards, feature tiles |
| `{rounded.xxl}` | 20px | Larger feature panels |
| `{rounded.xxxl}` | 24px | Feature-tile feature variants, app icon tiles |
| `{rounded.hero}` | 32px | Vibrant gradient pillar cards, promo CTA strip |
| `{rounded.full}` | 9999px | All buttons, all pill tabs, badges |

### Photography Geometry
- Vibrant pillar cards use 32px corner softening — distinct from the 16px used on quiet white cards. The doubled radius is the visual signature of "this is a featured pillar moment."
- Imagery inside cards is treated as photographic content (community, neighborhood, the depositing gesture) without rounded internal frames.
- Avatar circles (in testimonials/rankings) are `{rounded.full}` — perfect circles.

## Components

> Per the no-hover policy, hover states are NOT documented. Default and pressed/active states only.

### Buttons

**`button-primary`** — Verde-Profundo pill primary CTA, the dominant action across all surfaces ("Seja um Ponto de Coleta").
- Background `{colors.primary}`, text `{colors.on-primary}`, typography `{typography.button-md}`, padding `11px 24px`, rounded `{rounded.full}`.
- Pressed state `button-primary-pressed` lifts to `{colors.charcoal}`.
- Disabled state `button-primary-disabled` uses `{colors.hairline}` background and `{colors.muted}` text.

**`button-secondary`** — Outlined pill secondary action, paired with primary in dual-CTA hero patterns.
- Background transparent, text `{colors.ink}`, border `1px solid {colors.ink}`, typography `{typography.button-md}`, padding `11px 24px`, rounded `{rounded.full}`.

**`button-tertiary`** — White-fill quieter pill, used for tertiary nav and informational CTAs.
- Background `{colors.canvas}`, text `{colors.ink}`, border `1px solid {colors.hairline}`, typography `{typography.button-md}`, padding `11px 24px`, rounded `{rounded.full}`.

**`button-link`** — Inline text link styled as a subtle button.
- Background transparent, text `{colors.ink}`, typography `{typography.body-sm-medium}`, padding `8px 0`. Underline appears on activation.

**`button-icon-circular`** — 36×36px circular utility button (carousel arrows, share, copy).
- Background `{colors.canvas}`, text `{colors.ink}`, border `1px solid {colors.hairline}`, rounded `{rounded.full}`.

### Vibrant Pillar Cards

**`pilar-card-ambiental`** — Ambiental pillar signature card.
- Background `{colors.brand-verde}`, text `{colors.on-dark}`, rounded `{rounded.hero}` (32px), padding `{spacing.xxl}`.
- Hosts the pillar title in `{typography.display-lg}` with a white tagline (e.g. "Óleo longe da água").

**`pilar-card-social`** — Social pillar showcase (R$1 per liter to social causes).
- Background `{colors.brand-amarelo}`, text `{colors.ink}` (dark text on Amarelo), rounded `{rounded.hero}`, padding `{spacing.xxl}`.

**`pilar-card-educativo`** — Educativo pillar showcase (school programs and awareness).
- Background `{colors.brand-azul}`, text `{colors.on-dark}`, rounded `{rounded.hero}`, padding `{spacing.xxl}`.

**`pilar-card-comunitario`** — Comunitário pillar showcase (rankings and community rewards).
- Background `{colors.brand-floresta}`, text `{colors.on-dark}`, rounded `{rounded.hero}`, padding `{spacing.xxl}`.

**`destaque-card-foto`** — Dark photographic feature card (community/neighborhood imagery).
- Background `{colors.primary}` (deep green with overlaid photo), text `{colors.on-dark}`, rounded `{rounded.hero}`, padding `{spacing.xxl}`.

### Cards & Containers

**`card-base`** — Standard content/feature card.
- Background `{colors.canvas}`, rounded `{rounded.xl}`, padding `{spacing.xl}`, border `1px solid {colors.hairline}`.

**`card-feature`** — Quieter feature panel on Areia.
- Background `{colors.surface}`, rounded `{rounded.xl}`, padding `{spacing.xxl}`.

**`card-recommendation`** — "Conteúdo relacionado" tile in content/help footer.
- Background `{colors.canvas}`, rounded `{rounded.lg}`, padding `{spacing.lg}`, border `1px solid {colors.hairline}`.

**`promo-cta-card`** — Verde-+ campaign strip with embedded CTA pill ("A cada litro, R$1 para ações sociais").
- Background `{colors.brand-verde}`, text `{colors.on-dark}`, rounded `{rounded.hero}`, padding `{spacing.section}`. Embedded button uses `button-tertiary` (white pill on Verde +) for the "Participar" action.

**`feature-tile`** — White card in the feature matrix grid (Pontos de Coleta, Impacto em Tempo Real, Ranking & Gamificação, Prestação de Contas).
- Background `{colors.canvas}`, rounded `{rounded.xxxl}`, padding `{spacing.xl}`, border `1px solid {colors.hairline}`. Carries an icon/illustration top, title `{typography.card-title}`, description `{typography.body-sm}`.

### Inputs & Forms

**`text-input`** — Standard text field.
- Background `{colors.canvas}`, text `{colors.ink}`, border `1px solid {colors.hairline}`, rounded `{rounded.md}`, padding `{spacing.sm} {spacing.md}`, height 40px.

**`text-input-focused`** — Activated state.
- Border switches to `2px solid {colors.brand-azul-fundo}`.

**`text-input-error`** — Validation error state.
- Border switches to `1px solid #d45656`; error label below in matching red `{typography.body-sm}`.

**`search-pill`** — Help/content top-bar search field.
- Background `{colors.surface}`, text `{colors.steel}`, typography `{typography.body-sm}`, rounded `{rounded.md}`, height 36px, border `1px solid {colors.hairline}`.

### Tabs

**`segmented-tab`** + **`segmented-tab-active`** — Underline-style tab navigation (Ambiental / Social / Educativo / Comunitário on the impact page).
- Inactive: text `{colors.steel}`, transparent background, padding `{spacing.md} {spacing.lg}`. Active: text shifts to `{colors.ink}`, 2px bottom border in `{colors.ink}`.

**`pill-tab`** + **`pill-tab-active`** — Adesão-page tab nav (Condomínios / Escolas / Empresas).
- Inactive: background `{colors.canvas}`, text `{colors.steel}`, border `1px solid {colors.hairline}`, padding `{spacing.xs} {spacing.md}`, rounded `{rounded.full}`.
- Active: background `{colors.primary}`, text `{colors.on-primary}`, no border (or matching deep-green border).

### Badges & Status

**`badge-success`** — Pale-green confirmation badge ("Ativo", "Disponível").
- Background `{colors.success-bg}`, text `{colors.success-text}`, typography `{typography.caption-bold}`, rounded `{rounded.full}`, padding `4px 10px`.

**`badge-new`** — Verde-+ "NOVO" / "Ativo" pill for new points or campaigns.
- Background `{colors.brand-verde}`, text `{colors.on-dark}`, typography `{typography.caption-bold}`, rounded `{rounded.full}`, padding `4px 10px`.

**`badge-beta`** — Pale-água "EM BREVE" / informational pill.
- Background `{colors.brand-azul-200}`, text `{colors.brand-azul-fundo}`, typography `{typography.caption-bold}`, rounded `{rounded.full}`, padding `4px 10px`.

**`badge-code`** — Inline chip ("QR", "Ponto").
- Background `{colors.brand-azul-200}`, text `{colors.brand-azul-fundo}`, typography `{typography.caption-bold}`, rounded `{rounded.sm}`, padding `2px 6px`.

**`promo-banner`** — Sticky deep-green promotional strip ABOVE the top nav ("Cada litro coletado vira R$1 para ações sociais").
- Background `{colors.primary}`, text `{colors.on-primary}`, typography `{typography.body-sm-medium}`, padding `{spacing.sm} {spacing.lg}`. Carries one-line copy with optional inline link.

### Data Tables

**`data-table`** — Collection-points / coletas comparison table.
- Background `{colors.canvas}`, text `{colors.ink}`, typography `{typography.body-sm}`, rounded `{rounded.md}`, border `1px solid {colors.hairline}`.

**`data-table-header`** — Top header row of the data table.
- Background `{colors.surface}`, text `{colors.steel}`, typography `{typography.caption-bold}`, padding `{spacing.sm} {spacing.md}`.

**`data-table-row`** — Body rows.
- Background `{colors.canvas}`, text `{colors.ink}`, typography `{typography.body-sm}`, padding `{spacing.md}`, bottom border `1px solid {colors.hairline-soft}`.

### Navigation

**Top Navigation (Landing)** — Sticky white bar with logo, link list, and right-side CTAs.
- Background `{colors.canvas}`, height ~64px, bottom border `1px solid {colors.hairline-soft}`.
- Left: + Sustentável wordmark + horizontal link list (Como Funciona, Pontos de Coleta, Impacto, Parceiros).
- Right: deep-green-pill "Seja um Ponto" + outlined-pill "Entrar".

**Top Navigation (Dashboard)** — Compressed nav with center search-pill and right-side account/plan CTAs.
- Background `{colors.canvas}`, height ~56px, with search-pill at center and "Painel / Conta / Adesão" links + deep-green-pill "Cadastrar" right.

**`sidebar-nav-item`** + **`sidebar-nav-item-active`** — Dashboard left rail link entries.
- Inactive: background transparent, text `{colors.charcoal}`, typography `{typography.body-sm}`, rounded `{rounded.sm}`, padding `{spacing.xs} {spacing.md}`.
- Active: background `{colors.surface}`, text `{colors.ink}`, typography `{typography.body-sm-medium}`.

**`doc-toc-item`** — Right-rail detail/table-of-contents links.
- Background transparent, text `{colors.steel}`, typography `{typography.body-sm}`, padding `{spacing.xs} 0`. Active item color shifts to `{colors.ink}`.

### Signature Components

**`hero-landing`** — Centered hero with massive 80px display + dual-CTA pair.
- Layout: centered headline in `{typography.hero-display}` ({colors.ink}, "Cada litro soma"), centered subtitle in `{typography.subtitle}` ({colors.steel}), centered button row (`button-primary` + `button-secondary`).

**`pilares-grid`** — 4-column row of vibrant gradient pillar cards (landing "Nossos Pilares").
- Each tile uses one of the `pilar-card-*` variants (ambiental, social, educativo, comunitario) or `destaque-card-foto`.
- Card title in `{typography.display-lg}` or `{typography.heading-lg}`.
- Below the title: thin tagline in `{typography.body-sm}` at 80% white opacity (dark text on the Amarelo card).
- Optional badge top-right: `badge-new`.
- Card heights are uniform (~360–400px); the row scrolls horizontally on mobile.

**`feature-matrix`** — 4-column grid of white feature tiles below the pillar matrix (Pontos de Coleta / Impacto / Ranking / Prestação de Contas).
- Each tile is `feature-tile` chrome.
- Top: 100px-tall illustration zone (line-art icon or the "+" mark).
- Below: title in `{typography.card-title}`, description in `{typography.body-sm}` `{colors.steel}`.

**`prose-block`** — Help/educational content main area.
- Max-width ~720px, centered. Body in `{typography.body-md}` `{colors.charcoal}` line-height 1.6.
- Inline code in `{typography.body-md}` monospace fallback with `{colors.surface}` background and `{rounded.xs}` corners.

**`pontos-coleta-table`** — Dashboard table listing collection points and volumes.
- Uses `data-table` chrome. Each row carries a point name (linkified, in `{colors.ink}` body-sm-medium), a location column (`{colors.charcoal}`), a liters column, and a status badge column.

**`impacto-stat-row`** — Stats strip ("12.400+ litros coletados", "R$ 12.400 para ações sociais", "48 pontos ativos", "1.200+ moradores engajados"). Numbers are illustrative placeholders.
- Horizontal row of 4 stat cells, each with a large number in `{typography.heading-lg}` `{colors.ink}` and a label below in `{typography.body-sm}` `{colors.steel}`.

**`footer-region`** — Dense dark-canvas multi-column footer.
- Background `{colors.footer-bg}`, padding `{spacing.section} {spacing.xxl}`.
- Top row: + Sustentável wordmark ("Cada litro soma" tagline) and social icons.
- Body: multi-column link grid (Sobre / Como Funciona / Pontos de Coleta / Impacto / Contato).
- Section headers in `{typography.body-sm-medium}` `{colors.on-dark}`.

**`footer-link`** — Individual link entry inside the footer column.
- Background transparent, text `{colors.muted}`, typography `{typography.body-sm}`, padding `{spacing.xxs} 0`. Active/visited states do not change color — only opacity shifts on activation.

## Do's and Don'ts

### Do
- Use `{colors.primary}` (deep green / Verde Profundo) as the dominant CTA — it's the brand's most recognizable interactive element.
- Reserve pillar brand colors (`{colors.brand-verde}`, `{colors.brand-amarelo}`, `{colors.brand-azul}`, `{colors.brand-floresta}`) ONLY for pillar-identity moments — never for general buttons or text.
- Pair `{rounded.hero}` (32px) gradient cards with `{rounded.xl}` (16px) white cards in the same viewport — the radius contrast is the visual signature.
- Apply `{rounded.full}` to every button, every pill tab, every badge.
- Use `{typography.hero-display}` (80px, Poppins) with tight leading for hero displays — celebrate the gesture, never the pollution.
- Treat each pillar as a distinct color identity. Ambiental is Verde +, Social is Amarelo Soma, Educativo is Azul Água, Comunitário is Verde Floresta. These are brand assignments, not free choices.

### Don't
- Don't use Verde + or Amarelo Soma on body text or large surfaces — they lose meaning when overused.
- Don't put white text on Amarelo Soma; always use dark text there.
- Don't soften corners on buttons (anything less than `{rounded.full}`); the pill is a brand signature.
- Don't introduce a third typeface; Poppins + Inter handle every role.
- Don't apply heavy shadows on white cards; flat-with-borders is the default.
- Don't put gradient backgrounds on standard buttons; gradients are reserved for pillar-card identity moments.
- Don't use guilt-driven imagery (drains, spilled oil); the tone is optimistic and celebrates the gesture.

## Responsive Behavior

### Breakpoints
| Name | Width | Key Changes |
|---|---|---|
| Mobile (small) | < 480px | Single column. Hero drops to 40px. Pill nav collapses to hamburger. Pillar matrix horizontal-scroll. Footer 1-column accordion. |
| Mobile (large) | 480 – 767px | Same as small but feature matrix renders 2-up. |
| Tablet | 768 – 1023px | 2-column feature matrix. Pill-tab nav returns. Dashboard sidebar collapses to drawer. |
| Desktop | 1024 – 1279px | Full 4-column pillar matrix; 3-column dashboard grid (sidebar / content / detail). |
| Wide Desktop | ≥ 1280px | Wider hero gutters, larger imagery, fixed 220px sidebar. |

### Touch Targets
- Pill buttons render at 38–40px effective height — bumps to 44px on mobile via padding override.
- Circular icon buttons: 36×36px desktop → 44×44px on mobile.
- Form inputs render at 40px height; bumps to 44px on mobile.
- Sidebar nav items render at ~32px tall — bumps to 44px on mobile drawers.

### Collapsing Strategy
- **Promo banner** stays full-width; collapses to single line at < 480px with truncation.
- **Top nav** below 1024px collapses to hamburger; horizontal links move into drawer.
- **Dashboard grid**: 3-column desktop → sidebar-drawer at < 1024px → single-column with collapsible sidebar at < 768px.
- **Pillar matrix**: 4-column desktop → horizontal-scroll at < 1024px (carousel-style with snap points).
- **Feature matrix**: 4-column → 2-column at tablet → 1-column at mobile.
- **Hero typography**: `{typography.hero-display}` (80px) → 56px at < 1024px → 40px at < 768px → 32px at < 480px.
- **Stats strip**: 4-column → 2×2 at < 768px → 1-column at < 480px.

### Image Behavior
- Pillar card imagery uses photographic content with internal gradient overlays; lazy-loaded below the fold.
- Feature tile illustrations are SVG-based; remain crisp at all breakpoints.
- Avatar imagery in testimonials/rankings uses 1:1 aspect ratio with `{rounded.full}` masking.

## Padrões de telas administrativas (pt-BR)

> Estabelecidos na feature `006-endereco-estruturado-locais`, na tela de Locais. **Pontos de coleta
> e Coletas devem reaproveitá-los** em vez de reinventar — é o que mantém as telas coerentes.

### 1. Filtro por coluna com menu de funil

Toda tabela de dados usa `p-table` com `filterDisplay="menu"` e um `p-column-filter` por coluna,
com o operador de comparação visível ao usuário:

| Tipo de dado | Filtro |
|---|---|
| Texto (nome) | `type="text"` — contém, começa com, igual |
| Numérico (litros) | `type="numeric"` — maior que, menor que, entre |
| Lista fechada (tipo, situação) | `matchMode="equals"` com `p-select` no template `#filter` |

Cuidado ao consultar a documentação: os demos do PrimeNG chamados `filterbasic` e `filter-advanced`
usam `[showMenu]="false"`, que é o estilo **de linha** — o oposto do adotado aqui. A escolha do menu
é decisão de produto.

Quando um filtro não retorna nada, a mensagem é **distinta** da de lista sem cadastro, e traz a
saída ("Limpar filtros"). Confundir as duas faz o Gestor achar que perdeu dados.

### 2. Painel de cadastro sobreposto

Cadastro e edição usam `app-form-drawer` (`widget/components/form-drawer`), nunca uma janela modal
centralizada nem navegação para outra tela:

- posição **direita** a partir de 768 px, **de baixo para cima** abaixo disso — o breakpoint é o
  mesmo da tabela acima, via `ViewportService`
- **cabeçalho e rodapé fixos**: trilha de navegação e título no topo, ações embaixo, só o corpo rola
- o botão salvar fica **indisponível** enquanto houver campo obrigatório em branco; sem mensagem
  por campo e sem lista de pendências no rodapé
- o painel não conhece domínio: o formulário entra por `<ng-content>` e o pai decide quando salvar
  está disponível

### 3. Campo relacional com criação sobreposta

Campo que aponta para outro registro (o Local de um Ponto, o Ponto de uma Coleta) usa autocomplete
buscando no backend. Quando a busca não casa com nada, o estado vazio oferece **"+ adicionar"**, que
abre um **segundo painel sobre o primeiro**, sem fechá-lo. Ao salvar, o registro criado volta já
selecionado no campo e o painel de cima fecha.

**Painel sobre painel já está exercitado**, ainda que sem autocomplete: "Novo ponto" na ficha do
Local abre o cadastro de ponto empilhado, e a ficha permanece aberta atrás. O que aprendemos ali vale
para o padrão inteiro:

- **O empilhamento não precisa de configuração.** O `ZIndexUtils` do PrimeNG mantém uma pilha e
  incrementa a camada a cada painel modal (1101, depois 1102), então o de cima aparece acima sem
  `baseZIndex` na mão.
- **Cada nível recua 1,5 rem**, pelo input `nivel` do `form-drawer` (`0` é o painel de base). Dois
  painéis do mesmo tamanho se sobrepõem exatamente e parecem um só — o de baixo desaparece aos olhos
  de quem precisa saber que há algo atrás para voltar. O recuo é **encolhimento, não deslocamento**:
  o painel é ancorado numa borda, então diminuí-lo revela o de baixo do lado oposto à âncora,
  enquanto deslocá-lo abriria uma fresta contra a borda da tela e pareceria erro de posicionamento.
  À direita encolhe a largura; embaixo, a altura.
- **Declare o painel de cima fora do de baixo.** Dentro do `app-form-drawer`, ele seria projetado no
  corpo do primeiro painel e rolaria junto com o conteúdo, em vez de ser uma camada própria.
- **Quem hospeda o painel de cima é quem mostra a lista afetada**, não a página. A ficha do Local
  hospeda o cadastro de ponto porque é ela que exibe os pontos e precisa recarregá-los ao final.
- **Empilhar em vez de fechar é uma escolha por ação.** Editar e arquivar fecham a ficha, porque o
  dado exibido nela muda e ficaria velho atrás do formulário. Criar um filho não muda o pai: o
  usuário volta para a mesma ficha, agora com o item novo na lista.

> O que continua **não exercitado** é a parte do **autocomplete**: nenhuma tela ainda tem campo que
> aponta para outro registro. Local não tem, e o cadastro de Ponto não tem campo nenhum. A primeira
> aplicação de "buscar, não achar, + adicionar" será a tela de Coletas.

### Orçamento de bundle

O aviso de bundle inicial está em **560 kB** (erro em 1 MB), acima dos 500 kB originais. A elevação
foi deliberada: cada tela nova traz módulos do PrimeNG cuja infraestrutura compartilhada é içada
para o entry comum, e o `main` cresce sem que código de tela seja carregado antecipadamente. Na
feature 006 isso foi conferido por inspeção do bundle — drawer, máscara, filtros e consulta de CEP
ficaram todos no chunk lazy da página.

O número que importa para o usuário é a **transferência**: ~122 kB comprimidos no carregamento
inicial. O erro em 1 MB segue como guarda real contra carregar um domínio inteiro por engano.

### Rótulos internos do PrimeNG

Boa parte do texto que aparece na tela **não sai dos nossos templates**: os modos de comparação do
menu de filtro ("Contém", "Maior que"), os botões Limpar e Aplicar, "Nenhum resultado encontrado",
nomes de mês e os rótulos de acessibilidade são gerados pela biblioteca. Todos vêm de um único lugar:
`core/i18n/pt-br/pt-br.translation.ts`, aplicado no `providePrimeNG` do `app.config.ts`.

**Não traduza esses rótulos no template.** Passar `emptyMessage="…"` ou `[showClear]` com texto
próprio em cada tela é como a divergência começa — o mesmo conceito ganha três redações. Se um termo
da biblioteca aparecer em inglês, a correção é no arquivo de tradução, e vale para o app inteiro.

Duas armadilhas registradas junto do arquivo, porque nenhuma das duas dá sinal na tela:

- o merge do PrimeNG é de **um nível só**, então um objeto `aria` parcial substitui o da biblioteca
  por inteiro e transforma os rótulos ausentes em `undefined` para leitores de tela;
- `searchMessage` e `selectionMessage` passam por `replaceAll('{0}', …)` — remover o marcador não
  quebra nada visivelmente, só deixa de anunciar o número.

O `pt-br.translation.spec.ts` compara o arquivo com o padrão da **versão instalada** do PrimeNG: uma
atualização que acrescente rótulo falha o teste nomeando a chave, em vez de deixá-la vazar em inglês.

## Iteration Guide

1. Focus on ONE component at a time. The system has high internal consistency.
2. Reference component names and tokens directly (`{colors.primary}`, `{component-name}-pressed`, `{rounded.full}`) — do not paraphrase.
3. Run `npx @google/design.md lint DESIGN.md` after edits to catch broken refs and contrast issues.
4. Add new variants as separate `components:` entries (`-pressed`, `-disabled`, `-active`).
5. Default to `{typography.body-md}` for body and `{typography.subtitle}` for emphasis. Headlines step down `hero-display → display-lg → heading-lg → heading-md → heading-sm`.
6. Keep pillar colors (Verde +, Amarelo Soma, Azul Água, Verde Floresta) confined to pillar-card identity. If a pillar color appears on a standard button or generic surface, ask whether it earned that surface.
7. Pill-shaped buttons (`{rounded.full}`) always; squared buttons signal "third-party widget" in this language.

## Known Gaps

- Specific dark-mode token values (canvas, surface, ink, hairline) are not yet defined; a published dark-mode palette is pending.
- Animation/transition timings are not formalized; recommend 150–200ms ease for hover/focus state transitions.
- Form validation success state is not explicitly captured beyond defaults — implement following the standard green-border + success badge pattern.
- Map/point-cluster styling for the public collection-point map (privacy handling for private locations) is not yet formalized as tokens.