# Graha Adhistana — website

A static luxury website for Graha Adhistana (design & build, Pantai Indah Kapuk, est. 2002).
Plain HTML, CSS and vanilla JS: no build step, no framework.

## Run locally

```bash
python3 -m http.server 4321 --bind 127.0.0.1 --directory /Users/dave/Documents/graha-adhistana-website
```

Then open http://127.0.0.1:4321/.

## Pages

| File | What |
|---|---|
| `index.html` | Home: hero slideshow, studio intro, selected works, services, Future House build, Noble Padel, interiors |
| `projects.html` | Portfolio with filters (Modern / Classic / Interior / Commercial), grid and index views, plus the archive |
| `project.html?p=<slug>` | One template for every project; content comes from `assets/js/projects.js` |
| `services.html` | Services, process and FAQ |
| `about.html` | Story, the meaning of the name, philosophy and early work |
| `contact.html` | Enquiry form that composes a WhatsApp message, plus the studio location |

## Editing

- **Projects:** edit `assets/js/projects.js`. Each project has a name, category, location, year, scope, summary, story and images.
- **Header / footer:** edit `_partials/header.html` or `_partials/footer.html`, then run `python3 tools/sync-partials.py`.
- **Design system:** tokens and components are in `assets/css/style.css`; the rules are in `DESIGN.md`. Each page has its own `assets/css/<page>.css`.
- **Images:** `assets/img/ig/` holds the full-size images (from Instagram); `assets/img/m/` holds 1100px copies for grids.

## Before going live: confirm with the client

Facts on the site come only from their Instagram and current site. Please confirm or supply:

- Street address. A third-party listing gives "Rukan Eksklusif Bukit Golf Mediterania Blok G no. 72, PIK", but it is not used on the site yet.
- An email address (none was published).
- Opening hours, legal name, principals and a team photo, if they want them.
- Original high-resolution images without the Instagram watermark. Many current images carry a "Graha Adhistana — Design & Build" logo at the bottom; the layouts frame it out where possible.
- Project names and locations marked "Private commission", and whether to show renders and built photos side by side.
- The name story on the About page (*adhiṣṭhāna*, the plinth of a temple), to check they like it.

## Not for deployment

`_source/` (Instagram export, thumbnails, contact sheet, original images) and `tools/` are working
material. Leave them out of the deployed site.
