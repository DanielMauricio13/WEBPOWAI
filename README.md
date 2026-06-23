# PowAI Web

Public discovery website for PowAI, an AI fitness app for personalized training, nutrition, alarms, and progress tracking.

The public privacy policy is available on the website at `/#privacy`.

## Run Locally

```sh
npm install
npm run dev
```

## Build

```sh
npm run lint
npm run build
```

## Configuration

The website can talk to a same-origin `/api` path for account and support actions. In production, configure your hosting layer to route that path privately to the app service.

For local development, `vite.config.js` includes a dev-only proxy so the browser can call `/api` without showing service details in the website UI.
# WEBPOWAI
