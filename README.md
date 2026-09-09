# Codarafroj Play — play.coderafroj.me

A full quiz platform: anyone can sign up, build a quiz in any language, and
share it two ways — a **solo link** anyone opens and plays at their own pace,
or a **live game** where players join with a 6-digit code and everyone plays
together in real time, like a classroom quiz night.

This runs on its **own Firebase project** (`codrafroj-quiz`) — separate from
the coderafroj.me portfolio's project.

---

## 1. How it works

- **Anyone** can create a free account and build quizzes — they own every
  quiz they make, and can edit or delete it anytime from `/dashboard`.
- **Solo mode**: `/play/[quizId]` — no login needed to play. Enter your name,
  answer at your own pace, see your score. Results are logged so the quiz
  owner can see a leaderboard.
- **Live mode**: quiz owner clicks "Host Live" → gets a 6-digit code →
  players go to `/join`, enter the code + a nickname (no account needed) →
  host controls the pace (Start → Reveal → Next Question) and everyone sees
  results sync in real time, ending in a podium.
- **Admin panel** (`/admin`) — only visible to admin accounts. Lists every
  user and every quiz on the platform, with the power to delete any quiz.

## 2. Firebase project setup (codrafroj-quiz)

This project's Firebase config is already in `.env.local` — but a few things
need to be turned on in the Firebase Console for `codrafroj-quiz`:

1. **Build → Authentication → Get started → Sign-in method → Email/Password
   → Enable.** This is what lets people sign up and log in.
2. **Build → Firestore Database → Create database** → production mode → a
   region close to your users (e.g. asia-south1 for India).
3. **First admin account**: `lib/users.ts` already has your email
   (`coderafroj@gmail.com`) in the `OWNER_EMAILS` list — the first time you
   sign up on the live site with that exact email, you're automatically made
   an admin. No manual Firestore editing needed. Edit that file if you want
   to use a different email.

## 3. Deploy the Firestore rules

`firebase.json` and `.firebaserc` are already set up and pre-linked to the
`codrafroj-quiz` project, so this is a two-command job:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules
```

(No need to `npm install -g firebase-tools` — `npx` runs it without a global
install, which avoids the permission errors global installs often hit on
Linux.)

If `deploy` fails with a 403 "Caller does not have required permission"
error, it means the Google account you're logged into the CLI with doesn't
have access to `codrafroj-quiz`. Run `npx firebase-tools projects:list` to
see which projects your logged-in account can see, and `npx firebase-tools
login --no-localhost` if you need to switch accounts on a machine where a
browser can't open automatically.

## 4. Local development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

## 5. Deployment — play.coderafroj.me

```bash
npx firebase-tools login
npx firebase-tools init hosting   # choose "Use an existing project" -> codrafroj-quiz
npx firebase-tools deploy
```

Then in Firebase Console → **Hosting → Add custom domain** → enter
`play.coderafroj.me` and follow the DNS steps at your domain registrar (same
process as the main site — a CNAME/A record added there).

Alternatively, deploy to **Vercel** and add `play.coderafroj.me` as the
domain there instead.

## 6. Known v1 trade-offs (worth knowing)

- **Live mode players don't need an account.** This was intentional — anyone
  with a code can join instantly. The trade-off is that within a single game
  code, player score-writes aren't locked to a verified identity. Fine for a
  casual/classroom quiz tool; if you ever need tamper-proof scoring, that
  needs a Cloud Function to validate answers server-side.
- **Language field is per-quiz, not a full site translation.** The creator
  picks a language when building a quiz (shown to players), but the
  interface itself (buttons, labels) is in English.
- **No question images/media yet** — text-only questions and options for v1.

## 7. File map

```
app/
  page.tsx                        → marketing landing page
  login/, signup/                 → auth pages (anyone can sign up)
  dashboard/page.tsx              → "My Quizzes" list
  dashboard/new/page.tsx          → create a quiz
  dashboard/[quizId]/edit/        → edit a quiz
  dashboard/[quizId]/results/     → solo-mode leaderboard for a quiz
  play/[quizId]/page.tsx          → public solo play experience
  join/page.tsx                   → enter a live game code
  host/[code]/page.tsx            → host control panel (lobby/question/reveal/ended)
  live/[code]/page.tsx            → player's live game view
  admin/page.tsx                  → platform-wide admin overview
components/
  Navbar.tsx, Footer.tsx
  dashboard/QuizBuilder.tsx        → the question editor
  dashboard/QuizCard.tsx           → quiz row in "My Quizzes"
lib/
  firebase.ts                      → client init
  types.ts                         → Quiz, LiveSession, UserProfile, etc.
  quizzes.ts                       → quiz CRUD
  sessions.ts                      → live-game engine (join/answer/scoring)
  attempts.ts                      → solo-mode leaderboard logging
  users.ts                         → user profile + admin role handling
firestore.rules                    → security rules for this project
firebase.json / .firebaserc        → pre-linked to codrafroj-quiz
```

Any step you get stuck on, just ask.
# quiz
