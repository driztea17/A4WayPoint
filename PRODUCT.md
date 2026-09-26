# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML, CSS, and vanilla JavaScript. No framework, no build step, no npm to run the site. GSAP from a CDN is allowed for scroll and entrance motion. Hosted on GitHub Pages from the `main` branch root, served under the case-sensitive subpath `/A4WayPoint/`, so all paths are relative and the repo has an empty `.nojekyll`.

## Users

Leo members of Leo District 3231 A4 (Navi Mumbai and Raigad, India). They are young volunteers who plan and run club projects: service projects, fundraisers, workshops, seminars, awareness campaigns, club meetings, and outdoor events. Most open the site on their phones, often while planning in a group chat or on the day of an event.

Secondary users: district and club office bearers who maintain the content by editing JSON files. They are not developers.

## Product Purpose

A4 WAYPOINT is one central digital resource hub that helps Leo members move from an idea to a well executed and well documented project. It brings together venues, vendors, a resource bank, industry CSR opportunities, practical planning tools, ready AI prompts, and learnings from past projects.

Tagline: "A4 WAYPOINT: From ideas to action. From action to excellence."

Success means a member can find a venue or vendor, build a complete event checklist, draft a project brief, and copy a useful AI prompt in minutes, on a phone, without help.

## Positioning

It is built for one district's real project cycle, not general event planning. The core flow is fixed and named: Find Resources, Plan Your Project, Build Your Checklist, Create with AI, Execute, Document, Share. Every tool maps to a step of that flow, and every checklist ends with impact documentation, which Leo reporting needs.

## Operating Context

- Members share outputs in WhatsApp groups, so "Copy as text" matters as much as print.
- Checklists and project briefs are printed or saved as PDF on A4 paper for club meetings and reports.
- Content editors update JSON files in `/data` through GitHub. They need clear examples in the README.
- No backend, no login, no database. `localStorage` holds checklist progress and the recent SHUFFLE cards only.
- The Resource Hub is public, with no passcode. The district team decided on 2026-09-26 that clubs from other districts may use it too.

## Capabilities and Constraints

- Sections: Home, Resource Hub (Venues, Vendors, Banks, Resource Bank, Industry CSR), A4 Toolkit (Event Checklist Generator, Project Starter, Shuffle), AI Shortcut (Marketing, Reports, Communication, Events, Brainstorming, Design), Project Playbooks.
- Event types: Service Project, Fundraiser, Workshop, Seminar, Awareness Campaign, Club Meeting, Outdoor Event.
- Checklist phases: Before Event, During Event, After Event.
- All content loads from JSON in `/data`. Friendly loading and error states for every fetch.
- Mobile first, keyboard navigable, visible focus, WCAG AA contrast, respects `prefers-reduced-motion`.
- The "Suggest a resource" form URL and social links are config values the owner fills in later.
- SHUFFLE is a deck of 80 event ideas for clubs with a creative block: each card gives an event name, concept, twist, budget, and volunteer count. Three decks: Service (by the 8 Leo service areas), Leadership, and Fellowship. The 50 Service ideas come from the district's idea file; the 30 Leadership and Fellowship ideas are drafts for the team to review. `localStorage` remembers the last 5 cards shown.
- Copy rule: no em dashes anywhere in site copy, code comments, or README.

## Brand Commitments

- Name: A4 WAYPOINT (all caps in the wordmark).
- District logo: the Leo District 3231 A4 2026-2027 "Towards Excellence" badge (hexagon, navy field, lime green frame, star with trails, blue arc, Leo emblem). File: `assets/img/district-logo.png`, supplied by the owner. Use it as is. Do not redraw or recolour it.
- Colour: a mix. The logo's deep navy and lime green carry the brand. An orange accent (from the owner's reference images) marks actions. Confirmed by the owner.
- The owner's reference images (a client portal, an orange SaaS landing page, a class dashboard) guide layout character: generous white cards, soft depth, clear dashboards, timelines. They are not a palette authority.
- The district theme line "Towards Excellence" matches the tagline's "From action to excellence".
- Standing visual preference (owner's choice, 2026-09-26): the standard clean SaaS look, executed straight at the craft level of the owner's reference images. Light surfaces, white cards, soft depth, one action accent. The owner chose this over bolder concept directions.
- Must not feel: too dark (members use it outdoors in daylight) or too animated (it must stay fast on low-cost phones).

## Evidence on Hand

- District logo: `assets/img/district-logo.png` (trimmed from the owner's file).
- Real venues, vendors, bank branches, and CSR companies from the district "Club Resources" sheet, in `data/*.json`. Contact names are published with the owner's approval.
- 63 prompts from the district "Leo Prompt Bank" PDF, in `data/prompts.json`.
- Team: Leo Drishti Sinha and Leo Lion Shubham Upadhyay (Chief Innovation Officer and Chief Operations Officer). Photos supplied by the owner.
- The Resource Bank templates and the three playbooks are still SAMPLE placeholders. Do not invent real businesses, phone numbers, testimonials, member counts, or impact figures presented as real.

## Product Principles

1. Phone first: every task must work one-handed on a small screen.
2. Output travels: anything a member makes can be copied to WhatsApp or printed on A4.
3. Editable by non-developers: content lives in JSON with plain examples.
4. The flow is the product: every page shows where it sits in the journey from idea to documented impact.
5. Honest content: samples are always labelled as samples.

## Accessibility & Inclusion

WCAG 2.1 AA: semantic HTML, keyboard navigation, visible focus, alt text, ARIA labels where needed, AA contrast, and reduced motion support. Plain English copy for members who read English as a second language.
