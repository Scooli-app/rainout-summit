<p align="center">
  <img src="src/app/icon.svg" width="96" alt="Rainout Summit logo: a rain cloud wearing a HELLO my name is sticker" />
</p>

<h1 align="center">Rainout Summit</h1>

<p align="center">
  The storm cancelled Web Summit Lisbon 2026. This is where the meetings went.
</p>

<p align="center">
  <a href="https://github.com/Scooli-app/rainout-summit/actions/workflows/ci.yml"><img src="https://github.com/Scooli-app/rainout-summit/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license" />
</p>

---

Rainout Summit is a small online stand-in for a rained-out Web Summit. Attendees bring their Web Summit profile over with one paste, get a short list of people worth meeting every day, and take it from there: messages, small groups, topic rooms and video calls.

It's built for a few thousand people over a few days, not to replace the real thing.

> Independent community project. Not affiliated with Web Summit.

## Features

| | |
|---|---|
| **Profile import** | Paste the Web Summit app's "Copy profile link". We read that one public page and fill in name, title, company, location, industry, bio, photo and sessions. Never asks for Web Summit credentials |
| **Verification** | Optional verified tick: put a one-off `RAIN-XXXXX` code in your Web Summit bio and we re-check the page. One Web Summit profile can only be linked to one account |
| **Matches** | A daily shortlist built from what you need and what you offer, both ways. Claude picks the best eight and writes why you should meet. Falls back to rule-based reasons without an API key |
| **People** | Searchable directory with role, industry, "offers" and verified filters |
| **Chat** | Direct messages, groups of up to 12, and public topic rooms |
| **Meetings** | Pick a day, a 30-minute slot in your own time zone and a length. Once accepted, both people get a video link and a calendar link |
| **Contacts** | Email (required), WhatsApp and LinkedIn (optional), shown only to people you've chatted or booked a call with |

## Stack

- [Next.js 16](https://nextjs.org) (App Router, server actions) and React 19
- [shadcn/ui](https://ui.shadcn.com) on Radix, Tailwind CSS 4
- [Clerk](https://clerk.com) for sign-in (Google, LinkedIn, email)
- Postgres with [Drizzle ORM](https://orm.drizzle.team); embedded [PGlite](https://pglite.dev) for local development
- [Claude](https://www.anthropic.com/api) for match reasons
- [Daily](https://www.daily.co) for video rooms, with a Jitsi fallback

## Getting started

Requires Node 22.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without `DATABASE_URL` the app uses an embedded Postgres in `./.pglite` and runs migrations on start.

Clerk needs keys even locally. The quickest way is temporary dev keys, no account needed:

```bash
npx clerk@latest init --accountless
```

Want people to look at? Seed eight demo attendees, a few Lobby messages and a meeting request (local database only):

```bash
npm run seed:demo
```

### Environment

Copy `.env.example` to `.env.local`.

| Variable | Required | What it does |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Yes | Sign-in |
| `DATABASE_URL` | In production | Postgres connection. Empty means local PGlite |
| `AUTO_MIGRATE` | No | `true` runs migrations on boot |
| `ANTHROPIC_API_KEY` | No | Claude-written match reasons |
| `DAILY_API_KEY` | No | Daily video rooms instead of Jitsi links |

## Scripts

| Command | |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` / `npm run typecheck` | ESLint and TypeScript |
| `npm test` | Web Summit link and profile parser |
| `npm run test:db` | Database flows on a throwaway PGlite |
| `npm run test:flows` | Server actions end to end with two fake users |
| `npm run db:generate` / `npm run db:migrate` | Drizzle migrations |
| `npm run seed:demo` | Local demo data |

## Project layout

```
src/
  app/            routes: landing, onboarding, matches, people, chat, meetings, API
  app/actions.ts  server actions (profile, import, chat, meetings, matches)
  components/     app components; components/ui is shadcn
  db/             Drizzle schema, client, room seed
  lib/            Web Summit import, matching, chat, video, auth helpers
drizzle/          SQL migrations
tests/            node:test suites and the profile page fixture
DESIGN.md         visual direction, tokens and rules
```

## Deploying

1. Create a Postgres database (Neon's free tier is enough) and set `DATABASE_URL`
2. Run `npm run db:migrate` once, or set `AUTO_MIGRATE=true` for the first deploy
3. Create a Clerk production instance, enable Google and LinkedIn, set the keys
4. Set `ANTHROPIC_API_KEY` and, optionally, `DAILY_API_KEY`
5. Deploy to Vercel and add your domain

## Known limits

- Chat polls every 2.5 seconds instead of using websockets. Fine for a few thousand people
- The message rate limit is per server instance and rough
- Jitsi's public server asks the first person in a call to sign in. Set `DAILY_API_KEY` to avoid that
- Profile import depends on Web Summit's current page markup; `tests/fixtures/ws-profile.html` pins what the parser expects

## Contributing

Branch from `main`, open a pull request, and wait for CI to pass. `main` is protected: no direct pushes or force pushes. The PR template lists the checks to run.

## License

[MIT](LICENSE)
