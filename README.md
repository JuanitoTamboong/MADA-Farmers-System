# MADA Farmers System

MADA is a React and TypeScript prototype of a mobile-friendly farming information system. Its farmer-facing screens demonstrate farm records, crop health, farming tasks, finances, market prices, announcements, and assistance requests.

## Admin and user information

See [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) for the current farmer profile shown in the app, the available screens, and important limitations around accounts and data.

## Run locally

```sh
npm install
npm run dev
```

To create a production build, run `npm run build`.

## Project status

This repository currently contains a front-end prototype. It does not include a backend, persistent user database, working authentication, or a separate admin dashboard. The screens use hard-coded example content and in-memory UI state; do not treat displayed values or submitted forms as verified, centrally stored records.
