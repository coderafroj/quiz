# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for security problems. Report them privately using GitHub's
[private vulnerability reporting](https://github.com/coderafroj/quiz/security/advisories/new) for this repository.

Include what you found, how to reproduce it, and the possible impact. You will get a reply as soon as possible.

## Scope

In scope: authentication, Firestore security rules (`firestore.rules`), the AI generation route (`app/api/generate-quiz`), and anything that exposes user data.

## Known limitations (by design)

These are documented trade-offs, not hidden bugs:

- **Live games do not require an account.** Within a game code, player scores are validated by Firestore rules (range and shape), but not tied to a verified identity. Fine for casual and classroom use. Tamper-proof scoring would need server-side validation (for example Cloud Functions).
- **Anti-cheat is best-effort.** Copy blocking and tab-switch detection discourage cheating but cannot prevent it.
- **The AI route's rate limit is in-memory**, so it is per server instance on serverless hosting.

## Running your own copy

If you fork and deploy this project:

1. Use your own Firebase project and your own API keys.
2. Change the owner/admin emails in **both** `lib/users.ts` (`OWNER_EMAILS`) and `firestore.rules` (`isVerifiedOwner`). Whoever signs up with a listed, verified email becomes an admin.
3. Deploy the rules: `npx firebase-tools deploy --only firestore:rules`.
