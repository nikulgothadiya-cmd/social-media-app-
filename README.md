# Social Media App (MERN Scaffold)

## What you get
- Express + MongoDB API with auth and posts
- React (Vite) client with login/register/feed UI
- Minimal structure to extend into full social app

## Prereqs
- Node.js 18+
- MongoDB running locally or an Atlas connection string

## Setup
1) Install dependencies
```
npm install
npm install --prefix server
npm install --prefix client
```

2) Configure env
- Copy `server/.env.example` to `server/.env` and update values

3) Run dev servers
```
npm run dev
```

API: `http://localhost:5000`
Client: `http://localhost:5173`

## API routes
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/me`
- `GET /api/posts`
- `POST /api/posts`
- `POST /api/posts/:id/like`
