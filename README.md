# Omar M. Fawzy Portfolio

Personal portfolio site. **Live:** <https://shklala.github.io/omar-m-fawzy-portfolio/>

Technical Product Specialist at iSchool: product ownership, full-stack delivery and
automation across B2G and B2C. Also IT & Systems Administrator / Help Desk Lead at
Holol PMS UAE.

No build step, no framework, no dependencies. Three files and a folder of assets,
served straight from GitHub Pages.

## The idea

The site has an arcade layer, but the arcade is the *environment*, not the content.
The start screen, the cursor, the guide bot and its portals carry the personality.
The work itself is typeset straight, because real production numbers should not look
like a score.

That split is the rule to keep when editing: if something states a fact about Omar,
it gets the document's voice. If it is chrome, it can play.

## Design system

Everything is driven by tokens in `:root` at the top of `styles.css`. Change a token,
not a component.

**Color** carries meaning rather than decoration:

| Token | Role |
| --- | --- |
| `--ink-900` … `--ink-600` | page, sections, cards, borders |
| `--phosphor` | live and running: production links, the ledger, progress |
| `--violet` | interaction: links, focus, hover, the guide's portal |
| `--amber` | the guide bot only |

**Type** is two families plus one ornament:

- `--font-display` **Space Grotesk** for the name, section titles and figures
- `--font-body` **IBM Plex Sans** for everything you read
- `--font-arcade` **Press Start 2P**, confined to the start screen and HUD

**Scale**: `--step--1` to `--step-5` (major third, fluid at the top); spacing `--s-1`
to `--s-10` on a 4px base; radius by hierarchy, from `--r-sm` on chips to `--r-lg` on
cards.

**Motion budget**: one ambient effect (the starfield), one arrival per element, and
everything else answers a pointer. Resist adding a third ambient animation.

## Project structure

```
.
├── index.html            # All page content
├── styles.css            # Tokens, then components, then the game layer
├── script.js             # One IIFE, 17 numbered sections
├── omf.svg               # Favicon / logo
├── site.webmanifest
├── robots.txt
├── sitemap.xml
└── assets/
    ├── profile-320.webp  # Responsive portrait (320 / 480 / 640)
    ├── profile-480.jpg   # JPEG fallback
    ├── og-card.jpg       # 1200×630 share card
    ├── apple-touch-icon.png
    └── Omar-Mohamed-Fawzy-Resume.pdf
```

## Running locally

```bash
git clone https://github.com/shklala/omar-m-fawzy-portfolio.git
cd omar-m-fawzy-portfolio

python -m http.server 8000    # then open http://localhost:8000
# or
npx serve .
```

## Updating the content

| What | Where |
| --- | --- |
| The four hero figures | `.ledger` in `index.html`; each is a `.stat` and counts up on arrival |
| Experience entries | `.timeline`; two columns above 900px, stacked below |
| Projects | `.projects-grid`; cards carry `data-filter` (live/private/research) and `data-cursor` for the cursor label |
| Skills and levels | `.skills-grid`; the meter reads the `expert` / `advanced` / `working` class |
| What the guide says | `SCRIPT` and `TARGETS` in section 17 of `script.js` |
| Resume PDF | replace `assets/Omar-Mohamed-Fawzy-Resume.pdf` |
| Colors, type, spacing | the `:root` tokens at the top of `styles.css` |
| Contact form endpoint | the `action` on `#contactForm` (currently Formspree) |

Bump the `?v=` on the `styles.css` and `script.js` tags after a deploy, or returning
visitors keep the cached copies.

The footer year updates itself. If you change the portrait, regenerate the responsive
sizes rather than dropping in a full-resolution file.

## Accessibility

Skip link, visible focus rings, labelled controls, a keyboard-operable start screen
with a skip control, pinch-zoom enabled, and full `prefers-reduced-motion` support:
the intro is skipped, the cursor and portals are dropped, and the guide keeps talking
because the explanations are content. Every text colour clears WCAG AA against its
own background.

## License

MIT. See [LICENSE](LICENSE).

## Contact

- **Email:** omar55138@gmail.com
- **LinkedIn:** [omarmfawzy](https://www.linkedin.com/in/omarmfawzy/)
- **GitHub:** [shklala](https://github.com/shklala)
