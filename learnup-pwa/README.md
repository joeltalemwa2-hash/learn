# LearnUP — Offline-First Learning PWA

Education Without Limits. A Progressive Web App for Uganda's S1–S6 students, built so subjects and materials keep working with zero internet after the first download.

## File Structure

```
learnup-pwa/
├── README.md              This file
├── index.html               Main page — hero, subjects, materials, features,
│                           stats, testimonials, pricing, footer
├── reviews.html              Public "Rate Us" page — rating summary, review
│                           form, and live list of everyone's reviews
├── styles.css                All visual styling — colors, type, layout, components
├── app.js                     Shared behavior on every page — theme toggle, nav,
│                           materials rendering, install prompt, offline banner
├── reviews.js                  Review form + live review list logic (Firestore)
├── firebase-config.js          Your Firebase project keys go here (one file, one edit)
├── manifest.json            PWA metadata — app name, colors, icons, install behavior
├── sw.js                        Service worker — caches files so the app works offline
├── offline.html               Fallback page shown if an uncached page is opened offline
│
├── data/
│   └── materials.json       ← Upload point. Add/edit Learning Materials here.
│
└── icons/
    ├── icon-192.png              Standard app icon (192×192)
    ├── icon-512.png              Standard app icon (512×512)
    ├── icon-512-maskable.png     Safe-zone icon for Android adaptive icons
    ├── apple-touch-icon.png      iOS home screen icon
    └── favicon-32.png             Browser tab icon
```

## Reviews & Ratings — how it works

`reviews.html` is a public page where any visitor can post a star rating and comment. Because this is a static site with no server, the reviews need somewhere shared to live so *every* visitor sees the same list — that's what **Firestore** (Google's free real-time database) is for.

- `firebase-config.js` — the only file you edit to connect it. Paste your project's keys in.
- `reviews.js` — sends new reviews to Firestore and listens for live updates, so the list refreshes for everyone the moment someone posts.
- Ratings/comments are public by design (visible to all visitors) — that's the point of a review page — so only ask for information you're comfortable being public.

### One-time setup (free)

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Create project**.
2. Inside the project: **Build → Firestore Database → Create database** → start in *production mode* → pick a region (e.g. `europe-west1`, closest to Uganda).
3. **Firestore → Rules** tab → replace the default rules with:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /reviews/{reviewId} {
         allow read: if true;
         allow create: if request.resource.data.name is string
                       && request.resource.data.name.size() < 60
                       && request.resource.data.comment is string
                       && request.resource.data.comment.size() < 600
                       && request.resource.data.rating is int
                       && request.resource.data.rating >= 1
                       && request.resource.data.rating <= 5;
         allow update, delete: if false;
       }
     }
   }
   ```
   This lets anyone read and post a review, but nobody can edit or delete someone else's — and it rejects malformed data.
4. **Project settings** (gear icon) → **General** → *Your apps* → **Add app → Web (`</>`)** → register it (no hosting setup needed) → copy the `firebaseConfig` object it shows you.
5. Paste those values into `firebase-config.js`, replacing the `REPLACE_WITH_...` placeholders.
6. Re-upload/deploy. Reviews will start appearing live at `reviews.html`.

**Moderation note:** the rules above are open-by-design (anyone can post). If you want to remove an inappropriate review later, delete it manually from the Firestore console (Firestore → Data → `reviews` collection). If spam becomes an issue, the easiest upgrade is enabling Firebase App Check, or switching `allow create` to require Firebase Anonymous Auth — ask me if you want that added.



## How the files connect

```
index.html
 ├─ <link rel="stylesheet" href="styles.css">   → visual styling
 ├─ <link rel="manifest" href="manifest.json">  → makes the app installable
 ├─ <script src="app.js">                       → all interactivity
 └─ IDs/classes (e.g. #materialsGrid, .subject-card)
       ↕ must match names used in styles.css and app.js

app.js
 ├─ fetch('data/materials.json')  → reads your uploaded materials
 ├─ document.getElementById(...) → finds elements defined in index.html
 └─ navigator.serviceWorker.register('sw.js') → activates offline support

sw.js
 └─ APP_SHELL[] lists every file that must be cached for offline use
     (index.html, styles.css, app.js, manifest.json, data/materials.json, icons/*)

manifest.json
 └─ icons[] point to files inside /icons
```

**Golden rule:** an ID or class only works if it's spelled identically in every file that uses it. `index.html` defines it, `app.js` selects it, `styles.css` styles it. Rename in one place, rename in all three.

## Editing guide

| I want to... | Edit this file |
|---|---|
| Add/change a learning material (video, notes, past paper, audio) | `data/materials.json` only |
| Connect the review page to a live shared database | `firebase-config.js` (paste your Firebase keys) |
| Change how reviews are submitted, filtered, or displayed | `reviews.js` |
| Change review page layout or text | `reviews.html` |
| Moderate/remove a review | Firebase Console → Firestore → Data → `reviews` collection |
| Change colors, fonts, spacing, card design | `styles.css` |
| Add a new section or change text/copy | `index.html` |
| Change how something behaves (filters, animations, install prompt) | `app.js` |
| Make a new file/page work offline | Add its path to `APP_SHELL` in `sw.js`, then bump `VERSION` |
| Change app name, theme color, or icons | `manifest.json` (and replace files in `/icons` if changing icons) |

## Local preview

Service workers require `https://` or `localhost` — opening `index.html` directly (`file://`) will skip offline features. Serve it locally instead:

```bash
cd learnup-pwa
python3 -m http.server 8080
# then open http://localhost:8080
```

## Deploying

Upload the whole `learnup-pwa/` folder to any static host — GitHub Pages, Netlify, Vercel — with no build step. If deploying to a GitHub Pages *project* site (e.g. `username.github.io/repo-name/`), all paths in this project are already relative (`./`, `data/...`, `icons/...`), so it works as-is inside a subfolder.

After any deploy that changes `sw.js`'s `APP_SHELL` list, bump the `VERSION` constant at the top of `sw.js` — this forces returning visitors to refresh their offline cache instead of seeing stale files.