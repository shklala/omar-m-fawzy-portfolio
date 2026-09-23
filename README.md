# Omar M. Fawzy — Portfolio

Personal portfolio site. **Live:** <https://shklala.github.io/omar-m-fawzy-portfolio/>

Education Mentor & Product Specialist at iSchool New Cairo, and IT & Systems Administrator /
Help Desk Lead / Software Control Specialist at Holol PMS UAE.

No build step, no framework, no dependencies — three files and a folder of assets, served
straight from GitHub Pages.

## Features

- **Retro-arcade layer** — start screen, XP/level HUD, coins & streaks, matrix-rain transition,
  canvas starfield, typewriter reveals
- **Responsive** — single-column from 768px down, no horizontal scroll
- **Accessible** — skip link, visible focus rings, labelled controls, keyboard-operable start
  screen, pinch-zoom enabled, full `prefers-reduced-motion` support (the intro is skipped
  entirely and all ambient animation is disabled)
- **Fast** — WebP profile image with JPEG fallback (14 KB, down from a 4.9 MB PNG), non-blocking
  icon font, one rAF-throttled scroll handler instead of four listeners, ambient canvases
  disabled on small screens and hidden tabs
- **Discoverable** — Open Graph and Twitter cards, canonical URL, `Person` JSON-LD structured
  data, sitemap and robots.txt

## Project structure

```
.
├── index.html            # All page content
├── styles.css            # Base styles, then an appended "ENHANCEMENTS" block
├── script.js             # One IIFE, sectioned and commented
├── omf.svg               # Favicon / logo
├── site.webmanifest      # PWA manifest
├── robots.txt
├── sitemap.xml
└── assets/
    ├── profile-320.webp  # Responsive profile image (320 / 480 / 640)
    ├── profile-480.jpg   # JPEG fallback
    ├── og-card.jpg       # 1200×630 social share card
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

Opening `index.html` directly from the filesystem works too, but a local server is closer to
what GitHub Pages actually does.

## Updating the content

| What | Where |
| --- | --- |
| Experience entries | `.timeline` in `index.html` |
| Projects | `.projects-grid` in `index.html` — placeholder cards carry inline instructions |
| Skills and levels | `.skills-grid`; levels are the `expert` / `advanced` / `working` classes |
| Resume PDF | replace `assets/Omar-Mohamed-Fawzy-Resume.pdf` |
| Colors and spacing | the `ENHANCEMENTS` block at the bottom of `styles.css` |
| Contact form endpoint | the `action` on `#contactForm` (currently Formspree) |

The footer year updates itself. If you change the profile photo, regenerate the responsive
sizes rather than dropping in a full-resolution file.

## License

MIT — see [LICENSE](LICENSE).

## Contact

- **Email:** omar55138@gmail.com
- **LinkedIn:** [omarmfawzy](https://www.linkedin.com/in/omarmfawzy/)
- **GitHub:** [shklala](https://github.com/shklala)
