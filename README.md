# Football Player Career — Prototype 0.1

A mobile-first, installable web game prototype for a football player career mode.

## What's playable

- Create a player: name, position, age, height, dominant foot, skin tone, and hair color.
- Character art: anime-inspired facial features only; body, kit, pitch, and football context remain natural/stylized sports visuals.
- Career dashboard with player attributes, XP, energy, club record, and next fixture.
- Six training sessions that use energy and improve player attributes.
- Interactive match simulation with distinct passing, dribbling, through-ball, shooting, pressing, tackling, and covering decisions, score, commentary, player rating, XP, and career statistics.
- Automatic local save in the browser, plus JSON save export and reset.
- PWA manifest and service worker for installation/offline use when served from localhost or HTTPS.

## Quick demo

Open `Play-Demo.html` directly in a modern browser for a single-file demo. It does not require a build step.

## Run locally

No build step or package installation is required. From this folder, run:

```bash
python -m http.server 8080
```

Then open <http://localhost:8080> in a browser. On mobile, open the hosted HTTPS version and use **Add to Home Screen**.

## Save data

Version 0.1 saves to browser `localStorage` on the current device and browser profile. Use **Pemain → Ekspor Save** to download a JSON backup. Clearing browser site data can remove the local save.

## Current limitations

- This is a playable web/PWA prototype, not yet a compiled Android APK or a full 3D game-engine build.
- Supabase has been connected as an integration, but no Supabase project/database exists in the connected account yet. Cloud accounts, cross-device sync, and online leaderboards are therefore not enabled.
- Match events are a lightweight decision-based simulation, not a real-time 3D match engine.
- All clubs are fictional prototype teams; no licensed club/player assets are included.

## Next development milestone

1. Create a Supabase project and implement authenticated cloud saves with row-level security.
2. Replace the simplified match simulator with a richer match engine and tactical positioning.
3. Move the prototype into a native/mobile game engine if a downloadable Android build is the required release format.