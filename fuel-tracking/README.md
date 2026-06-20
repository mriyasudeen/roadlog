# Audi A4 Fuel Tracker

A polished iPhone-first React + Vite PWA-style fuel tracker.

## Run locally on Mac

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## Test on iPhone without deploying

Keep the dev server running, then use the Network URL shown by Vite, for example:

```text
http://192.168.1.25:5173
```

Mac and iPhone must be on the same Wi-Fi.

## Deploy to Vercel

```bash
npm run build
npx vercel
```

## Data storage

Fuel entries are stored in browser localStorage on the device/browser used.
