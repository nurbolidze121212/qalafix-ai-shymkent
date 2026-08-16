# QalaFix AI 2.0 — Design System

Source of truth: the mobile reference supplied on 2026-08-16. Database suggestions that conflict with this reference are intentionally overridden.

## Product character

- Feels like a native civic application, not a marketing website.
- Calm, trustworthy, compact and immediately understandable.
- One primary action per screen.
- Mobile screens use a local centered title and a fixed bottom navigation.
- Desktop extends the same component language instead of becoming a separate visual style.

## Color

| Role | Value |
| --- | --- |
| Primary | `#00A66A` |
| Primary hover | `#008E5B` |
| Heading | `#10203A` |
| Body | `#475569` |
| Muted | `#64748B` |
| Page | `#FFFFFF` |
| Subtle surface | `#F8FAFC` |
| Border | `#E2E8F0` |
| Soft green | `#ECFDF5` |

Orange and red are reserved for priority and errors. No purple, neon, glassmorphism, dark hero cards or decorative gradients.

## Type

- Native system font stack for fast rendering and app familiarity.
- Mobile page title: 15px / 700.
- Mobile hero: 34px / 800 / tight tracking.
- Card title: 14–16px / 700.
- Body: 13–15px / 400–500.
- Metadata: 10–11px / 600.

## Components

- Internal cards: 18px radius, 1px neutral border, very soft shadow.
- Primary button: 48px minimum height, 14px radius, solid emerald.
- Secondary button: white, 1px neutral border, no heavy shadow.
- Inputs: 48px minimum height, 14px radius, visible label and focus ring.
- Icons: Lucide only; 16–22px depending on hierarchy.
- Bottom navigation: edge-to-edge white bar, top border, four equal items, safe-area padding.
- Camera target: large dashed emerald border, circular pale-green icon area.
- Map: full-width on mobile, controls and one floating report card layered over the map.

## Motion

- 150–250ms color/opacity transitions only.
- No scale hover, rotating cards, glowing orb or fake analysis animation.
- Respect `prefers-reduced-motion`.

## Responsive requirements

- Verified widths: 360, 375, 390, 414, 1024 and 1440px.
- No horizontal document scrolling.
- Fixed navigation must never cover the final interactive control.
- Touch targets are at least 44px.

## Prohibited patterns

- Global website header on mobile.
- Floating pill-shaped bottom navigation.
- Marketing statistics presented as real city data.
- Dark photo hero, neon AI orb, oversized gradients and empty decorative space.
- Full edit form shown before the user requests “Изменить детали”.
- Emoji icons, unlabeled fields or color-only status communication.
