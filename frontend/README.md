# Socratic Tutor — Frontend

React 19 + TypeScript SPA for the Socratic Tutor application. Built with Vite and Tailwind CSS v4.

---

## Tech Stack

| Tool | Version | Role |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 8 | Build tool & dev server |
| Tailwind CSS | v4 (`@tailwindcss/postcss`) | Utility-first styling |
| react-router-dom | v7 | Client-side routing |
| axios | latest | REST API client |
| lucide-react | latest | Icon library |

---

## Project Structure

```
src/
├── App.tsx                  # Route definitions
├── main.tsx                 # React application mount
├── index.css / App.css      # Global styles
├── components/
│   └── AdminProtectedRoute.tsx  # JWT-gated route guard
├── pages/
│   ├── StudentLogin.tsx         # Student name + roll number intake
│   ├── StudentChat.tsx          # Chat workspace with session list
│   ├── AdminLogin.tsx           # Admin credential form
│   ├── AdminDashboard.tsx       # LLM config editor
│   ├── StudentLogsPage.tsx      # Student list with Export All button
│   ├── StudentSessionsPage.tsx  # Per-student session table with Export button
│   └── ConversationPage.tsx     # Full chat-bubble transcript + Export button
├── services/
│   ├── api.ts                   # Student / session / chat Axios helpers
│   └── adminApi.ts              # Admin Axios helpers + download export functions
└── types/
    └── api.ts                   # TypeScript interfaces (Student, Session, Message)
```

---

## Routes

| Path | Component | Auth |
|---|---|---|
| `/` | `StudentLogin` | Public |
| `/chat` | `StudentChat` | Public |
| `/admin` | `AdminLogin` | Public |
| `/admin/dashboard` | `AdminDashboard` | JWT required |
| `/admin/logs` | `StudentLogsPage` | JWT required |
| `/admin/logs/:studentId` | `StudentSessionsPage` | JWT required |
| `/admin/logs/:studentId/:sessionId` | `ConversationPage` | JWT required |

---

## Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Type-check and build for production
npm run build

# Lint
npm run lint
```

The dev server proxies API requests to the FastAPI backend. The base URL is set via:
- `VITE_API_URL` environment variable (if set), or
- Falls back to `http://127.0.0.1:8000/api` (see `src/services/api.ts`).

---

## Admin Authentication

The admin token is stored in `localStorage` under the key `admin_token`. All admin API calls attach it as `Authorization: Bearer <token>`. The `AdminProtectedRoute` component redirects to `/admin` if the token is absent.

---

## Export / Download

Three levels of data export are available from the admin portal, all backed by backend endpoints:

| Page | Button | Scope |
|---|---|---|
| Student Logs | ⬇ Export All (.xlsx) | All students, sessions, messages |
| Sessions | ⬇ Export Student (.xlsx) | One student's full history |
| Conversation | ⬇ Export Session (.xlsx) | Single session messages |

Downloads are triggered client-side via a temporary `<a>` element with a Blob URL — no new tabs are opened.
