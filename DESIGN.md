# Rainout Summit — Design

Clean and people-first, in the spirit of Airbnb and Cal.com, put through an [unslop](https://github.com/heydamir/unslop) pass (by Damir Sokolovsky, CC BY 4.0) and Anthropic's frontend-design guidance to remove the AI-template tells.

## Direction
- **Product:** a stand-in for the rained-out Web Summit Lisbon where attendees import their profile, get matched, chat and book calls
- **Character:** sociable, exact, unhurried
- **World:** Lisbon on a wet November day. Cool stone neutrals, azulejo blue as the one accent
- **Moment:** the people, and the reason two of them should meet. Match reasons are the largest text on a match card
- **Signature:** the pairing, your avatar overlapping theirs, wherever a connection is shown (matches, the landing preview)

## Logo
The storm that cancelled Web Summit, turning up anyway: a rain cloud wearing a red "HELLO my name is" sticker, glancing away with a wobbly sorry mouth, still drizzling. `src/components/Logo.tsx` (header) and `src/app/icon.svg` (favicon). Flat, two colours plus the sticker red, readable at 20px.

## Components
Everything is built on shadcn/ui (Radix, Nova preset) in `src/components/ui`. shadcn's CSS variables are mapped onto the tokens below in `globals.css`, so components pick up the palette without per-use overrides. Booking uses `Dialog` on desktop and `Drawer` on phones; forms use `Field`; empty states use `Empty`; confirmations use `sonner` toasts.

## Rules
- Chrome stays quiet. Neutral ink ramp for every surface; the accent appears once or twice per screen (verified mark, selected slot, links)
- Primary buttons are ink (`--primary`), not the accent
- Type: Instrument Sans, weights 400 to 600, page titles 500. No uppercase tracked labels, no trailing periods on short strings, no exclamation marks, no greeting headlines
- Roles are quiet text with a small coloured dot, never filled pills
- Avatars without photos use neutral initials, not rainbow tints
- Radius by size: controls 10, tags 6, cards 16, modals 16. Not everything is a pill
- Hairline borders at 8% ink; hover is a border step, never a lift or scale
- Meta joins with commas, not middle dots
- One easing curve, `cubic-bezier(0.22, 1, 0.36, 1)`; motion only for modal entrance and button press
- Booking is a modal: day, 30-minute slot in local time, length

## Tokens (src/app/globals.css)
| Token | Light | Dark |
|---|---|---|
| `--bg` | #F5F7FA | #0B0D14 |
| `--surface` | #FFFFFF | #11141C |
| `--bg-subtle` | #ECEFF4 | #1A1E28 |
| `--ink` / `--ink-2` / `--ink-3` | #111827 / #4B5565 / #6B7487 | #EEF0F5 / #A3A9B8 / #7A8296 |
| `--line` | ink at 8% | ink at 8% |
| `--brand` | #2343D5 | #7F96FF |
