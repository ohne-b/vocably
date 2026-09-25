# App Stores

Internal tool for generating App Store and Google Play assets (screenshots, feature graphic, icons).

```bash
npm install
npm run app-stores
```

Pick a format in the sidebar, then click **Download ZIP** to get every screenshot at its exact pixel size, in one folder per language (`en/01.png`, `en/02.png`, …).

- `src/formats` — store asset sizes
- `src/devices` — one component per format, rendering its screenshots per language
- `src/templates` — asset designs, rendered at full resolution
