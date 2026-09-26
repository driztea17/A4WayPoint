# A4 WAYPOINT

**From ideas to action. From action to excellence.**

A4 WAYPOINT is the digital resource hub for Leo members of Leo District 3231 A4 (Navi Mumbai and Raigad, India). It helps members find resources, plan projects, build event checklists, create content with AI, and learn from past projects.

Live site: https://a4waypoint.pages.dev/ (main address, on Cloudflare Pages)

Copy on GitHub Pages: https://driztea17.github.io/A4WayPoint/

The site is plain HTML, CSS, and JavaScript. It has no build step and needs no npm. All content lives in JSON files in the `data` folder.

## Pages

| Page | File | What it does |
| --- | --- | --- |
| Home | `index.html` | Hero, the seven-step route, and links to every section |
| Resource Hub | `resources.html` | Venues, vendors, banks, resource bank, and industry CSR |
| A4 Toolkit | `toolkit.html` | Links to the two tools |
| Event Checklist Generator | `checklist.html` | Checklist for 7 event types. Saves on the phone, prints on A4, copies to WhatsApp |
| Project Starter | `project-starter.html` | Guided form that builds a printable project brief |
| AI Shortcut | `ai-shortcut.html` | 63 copy-ready prompts with fill-in blanks |
| Leadership Bingo | `bingo.html` | A 3 by 5 bingo card of club leadership goals to cross off, download, and share |
| Shuffle | `shuffle.html` | 80 event idea cards (Service, Leadership, Fellowship) for clubs that are stuck |
| Project Playbooks | `playbooks.html` | Learnings from past projects |

## Deploy on Cloudflare Pages (main address)

The site at https://a4waypoint.pages.dev/ is the Cloudflare Pages project `a4waypoint`. It is published by direct upload with Wrangler, not from Git, so a push does not update it. Publish it again after each change:

1. Sign in once on this computer: `npx wrangler login`.
2. Make a clean copy of the committed files (this leaves out `.git` and the ignored `.xlsx` and `.pdf` files):

   ```bash
   rm -rf ../cf-site && mkdir ../cf-site && git archive HEAD | tar -x -C ../cf-site
   ```

3. Publish the copy:

   ```bash
   npx wrangler pages deploy ../cf-site --project-name a4waypoint --branch main
   ```

The site is live in less than a minute. Cloudflare serves `/bingo.html` also as `/bingo`.

## Deploy on GitHub Pages

1. Push the `main` branch to https://github.com/driztea17/A4WayPoint.
2. On GitHub, open the repository and select **Settings**.
3. In the left menu, select **Pages**.
4. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
5. Set **Branch** to `main` and the folder to `/ (root)`. Select **Save**.
6. Wait one or two minutes. The site is live at https://driztea17.github.io/A4WayPoint/.

Every push to `main` updates the live site in about a minute.

Notes:

- The empty `.nojekyll` file tells GitHub Pages to serve the files as they are. Do not delete it.
- All links are relative, so the site works under `/A4WayPoint/`. GitHub Pages paths are case-sensitive: `A4WayPoint` is not the same as `a4waypoint`.

## Preview on your computer

The pages load JSON with `fetch`, so opening `index.html` directly from your folder does not work. Start a small local server in the repository folder:

```bash
python -m http.server 8000
```

Then open http://localhost:8000 in your browser.

## Edit the content

Always keep the JSON format: every text in "double quotes", a comma between items, and no comma after the last item. If a page shows "This section did not load", the JSON file usually has a missing or extra comma. You can check a file at https://jsonlint.com.

Entries with `"sample": true` show a SAMPLE badge. Set it to `false` for real entries.

### Venues, vendors, banks, resource bank, and industry CSR

Each list has its own file: `data/venues.json`, `data/vendors.json`, `data/banks.json`, `data/resource-bank.json`, and `data/csr.json`. Each file has an `items` list. To add an entry, copy an existing block inside `items`, paste it after a comma, and change the values.

To edit a file on GitHub: open it, select the pencil icon (**Edit this file**), make the change, and select **Commit changes**. The site updates in about a minute.

These lists are public. Anyone can read every phone number and name in them, so add only contacts that agree to be listed.

Example venue (`venues`):

```json
{
  "id": "welcome-hall-nerul",
  "name": "Welcome Hall",
  "area": "Nerul",
  "type": "Hall",
  "capacity": 120,
  "approxCost": "Rs 8,000 per day",
  "phone": "+91 00000 00000",
  "whatsapp": "+91 00000 00000",
  "email": "",
  "address": "Sector 14, Nerul, Navi Mumbai 400706",
  "notes": "Stage and chairs included.",
  "mapLink": "https://www.google.com/maps/search/?api=1&query=Welcome+Hall+Nerul",
  "sample": false
}
```

- `capacity` is a number or `null`. The capacity filter shows only when at least one venue has a capacity.
- Leave `whatsapp` empty for landline numbers.

Example vendor (`vendors`):

```json
{
  "id": "gayatri-stationary",
  "name": "Gayatri Stationary",
  "contactName": "",
  "category": "Stationery",
  "area": "Vashi",
  "phone": "+91 00000 00000",
  "whatsapp": "+91 00000 00000",
  "email": "",
  "address": "",
  "priceRange": "",
  "notes": "All stationery.",
  "sample": false
}
```

`priceRange` is optional: `Budget`, `Mid-range`, or `Premium`.

Example bank branch (`banks`):

```json
{
  "id": "federal-bank-cbd-belapur",
  "name": "Federal Bank",
  "area": "CBD Belapur",
  "address": "Balaji Bhavan, Sector 11, CBD Belapur, Navi Mumbai 400614",
  "phone": "+91 22 0000 0000",
  "contactName": "",
  "designation": "",
  "minBalance": "",
  "fdRate": "About 7.25% a year for general customers",
  "mapLink": "",
  "sample": false
}
```

Example resource bank item (`resource-bank`). `type` is `Template`, `Guide`, `Document`, or `Link`:

```json
{
  "id": "event-report-template",
  "title": "Event report template",
  "type": "Template",
  "description": "One-page report with objective, activities, impact numbers, and photos.",
  "link": "https://docs.google.com/document/d/your-file-id",
  "sample": false
}
```

Example industry CSR entry (`csr`):

```json
{
  "id": "example-industries",
  "organisation": "Example Industries Pvt. Ltd.",
  "area": "Rasayani",
  "sector": "Chemicals",
  "focusAreas": ["Education", "Environment"],
  "description": "Chemicals manufacturer",
  "website": "https://example.com/",
  "email": "",
  "phone": "",
  "applicationLink": "",
  "notes": "",
  "sample": false
}
```

### Checklist items (`data/checklists.json`)

- `base` items show for every event type.
- Each event type in `eventTypes` adds its own items to `before`, `during`, or `after`.
- `icon` is the name of an icon in `assets/img/icons.svg` without the `i-` prefix, for example `heart`, `wallet`, `mic`, or `sun`.

Example: add an item to Fundraiser, in the "After Event" phase:

```json
"after": [
  "Funds reconciled with the treasurer",
  "Donor thank-you messages sent",
  "Fund utilisation report shared with donors"
]
```

Members who already started a checklist keep their saved list. They see new items after they select **Reset**.

### AI prompts (`data/prompts.json`)

Put every fill-in field in square brackets, for example `[EVENT NAME]`. The page turns each one into an input. `[TO BE FILLED]` and `[TO BE CONFIRMED]` are instructions for the AI, so the page does not ask for them. `category` must be one of the ids in `categories`.

```json
{
  "id": "p64",
  "number": 64,
  "category": "communication",
  "title": "Thank a Venue Owner",
  "subcategory": "Thank-you Notes",
  "prompt": "Write a short thank-you message to [VENUE OWNER] for letting [CLUB NAME] use [VENUE] for [EVENT NAME] on [DATE].\nKeep it warm and under 80 words. Give me an email and a WhatsApp version."
}
```

Use `\n` for a new line inside a prompt.

### Shuffle event ideas (`data/shuffle.json`)

Each card is one event idea in `cards`. Give a new card the next `id` (it shows as SHUFFLE #81).

- `category` is `service`, `leadership`, or `fellowship`.
- `area` is only for service cards. It must match a name in `serviceAreas`: Childhood Cancer, Diabetes, Disaster Relief, Environment, Humanitarian Efforts, Hunger, Vision, or Youth. Leave it `""` for leadership and fellowship cards.
- Keep `concept` and `twist` to one short sentence each, so the card fits on a phone.

```json
{
  "id": 81,
  "category": "service",
  "area": "Hunger",
  "name": "Tiffin Trail",
  "concept": "Collect home-cooked tiffins from members' families and share them at a shelter.",
  "twist": "Every tiffin carries a handwritten note.",
  "budget": "₹1,000 to ₹2,500",
  "volunteers": "8 to 12"
}
```

The page remembers the last 5 cards on each phone and does not repeat them straight away. "Plan this event" opens the Project Starter with the idea filled in.

### Leadership Bingo (`data/bingo.json`)

The card has 15 squares in `squares`, shown 3 across and 5 down, read left to right. Change a square's `text` to change the goal. Keep each text to about 8 words so it fits the square and the downloaded image. `title` is the big word ("bingo") and `label` is the curved word ("leadership").

```json
{ "id": 10, "text": "Club conducted 1 LAS session" }
```

A full row of 3 or a full column of 5 counts as a bingo. Crossed-off squares and the club name save on each phone. "Download card" makes a 1080 by 1350 image.

### Playbooks (`data/playbooks.json`)

```json
{
  "id": "tree-drive-2026",
  "sample": false,
  "projectName": "Tree Plantation Drive",
  "club": "Leo Club of Example",
  "date": "2026-07-12",
  "category": "Outdoor Event",
  "objective": "Plant 200 native saplings along the lake road.",
  "whatWasDone": ["Took ward office permission", "Planted in teams of four"],
  "budget": { "total": 18000, "notes": "Saplings, tools, and water" },
  "impact": [
    { "label": "Saplings planted", "value": "200" },
    { "label": "Volunteers", "value": "45" }
  ],
  "whatWorked": ["Starting at 7 am"],
  "doDifferently": ["Book the water tanker earlier"],
  "tips": ["Tag each sapling with the planter's name"],
  "photos": [{ "src": "assets/img/playbooks/tree-drive-1.jpg", "alt": "Volunteers planting saplings" }]
}
```

The `id` becomes the link to the playbook: `playbooks.html#tree-drive-2026`. Put photos in `assets/img/playbooks/` and keep each under 300 KB.

## Settings (`assets/js/config.js`)

| Setting | What it does |
| --- | --- |
| `suggestFormUrl` | Link for **Suggest a resource**, for example a Google Form. When it is empty, the button opens an email instead |
| `suggestEmail` | Email for resource suggestions and playbook submissions. Currently `leodistrict3231a4@gmail.com` |
| `social` | Footer links for Instagram, Facebook, LinkedIn, and YouTube. Leave a link as `""` to hide its icon |
| `whatsappCountryCode` | Country code for 10-digit WhatsApp numbers (`91`) |

## Logo and favicon

- `assets/img/district-logo.png` (512 px) and `assets/img/district-logo-128.png` (128 px) are the district logo.
- `assets/img/favicon.svg` is a placeholder browser icon. Replace it with a district mark if you have one.

## Folder structure

```
index.html, resources.html, toolkit.html, checklist.html,
project-starter.html, ai-shortcut.html, playbooks.html, 404.html
assets/css/   base.css (tokens, layout, header, footer), components.css, pages.css, print.css
assets/js/    one file per feature, plus utils.js, layout.js, motion.js,
              config.js (settings)
assets/img/   logo, favicon, icons.svg
data/         all JSON content
```

The header and footer are the same in every HTML file. If you change the menu, change it in every page.

## Writing rules for the site

- Plain, short English. Many members read English as a second language.
- No em dashes in copy, comments, or this README. Use a comma, a colon, or a full stop.
- Mark placeholder content as SAMPLE. Never invent real businesses, phone numbers, or impact figures.

---

Built for Leo District 3231 A4. Towards Excellence, 2026-2027.
