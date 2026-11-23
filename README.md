# cgb-my-savings

A private, local-first savings tracker. Record your balances at the end of each month, see how they change, and compare your actual savings with your predicted total.

This is an installable, responsive **Progressive Web App (PWA)**, not a native mobile app. It has no backend, database, accounts, or cloud synchronization.

## Languages

The interface supports **English** and **Spanish**. Use the language selector in the header to switch at any time, including while editing a check-in. Your selection is remembered in this browser; on the first visit, the app uses a supported browser language or falls back to English.

Dates, EUR amounts, percentages, chart labels, accessible labels, confirmations, and application messages follow the selected language. Source names and JSON field names are not translated, and changing language does not alter savings data. Native date/file pickers and underlying browser or operating-system error details may follow your system language instead.

Only the language preference is stored in browser local storage. Financial data still requires **Save JSON**. If browser settings prevent saving the language preference, the selected language works for the current session and a warning is shown.

## Run locally

Run the commands below from the `cgb-my-savings/` project directory.

Use **Node.js 22.22.2**, pinned in `.nvmrc`, and npm. If you use [nvm](https://github.com/nvm-sh/nvm):

```bash
nvm install
nvm use
npm ci
npm run dev
```

Without nvm, install the pinned Node version first, then run `npm ci` and `npm run dev` from the project directory.

Open the address printed by Vite, normally **http://127.0.0.1:5173**, in desktop **Chrome or Edge**. Stop the server with `Ctrl+C`.

The local Vite server only serves the application. Your financial data is not sent to it.

### Preview a production build

```bash
npm run build
npm run preview
```

Open the printed address, normally **http://127.0.0.1:4173**. The build is generated in `dist/`; the preview command serves it locally.

The production build includes the install manifest, icons, and an offline service worker. Wait for **App ready offline** before disconnecting. Development mode (`npm run dev`) does not register a service worker, so stale offline assets cannot interfere with development.

## Install on Android

1. Build with `npm run build`.
2. Serve **only `dist/`**, at the root of a static site with a valid **HTTPS** address. Static hosting serves app assets, not your financial data; do not upload savings JSON files or expose the project directory.
3. Open that HTTPS address in an up-to-date **Chrome for Android**.
4. Wait for **App ready offline**, then tap **Install app** in cgb-my-savings. If Chrome does not expose a prompt, use its **⋮ menu → Install app / Add to Home screen**.
5. Launch cgb-my-savings from its home-screen icon. Use **Open JSON** to select your file, or start a check-in and **Save JSON** to create one.

File saving requires both `showOpenFilePicker` and `showSaveFilePicker`. Current compatibility data lists Chrome for Android 132+; the app checks actual API availability instead of assuming support from the browser name. Verify opening and saving a test JSON file on your phone before relying on it. Installing a PWA does not grant extra file permissions or add support to an incompatible browser.

The app and its chart work offline after caching, without the Mac or a running server. **Offline installation does not save financial edits:** apply the check-in, then use **Save JSON**. Reopen the JSON file when launching a new session. Mac and phone files do not automatically synchronize.

### Private testing over USB

If Android SDK Platform Tools (`adb`) are already installed, you can test from your Mac without public hosting:

1. Run `npm run build` and `npm run preview` on the Mac.
2. Enable USB debugging on your Android phone, connect it by USB, and accept its authorization prompt.
3. In another terminal, run:

   ```bash
   adb reverse tcp:4173 tcp:4173
   ```

4. On the phone, open **http://localhost:4173** in Chrome. This is the phone's trusted loopback origin, forwarded to the Mac. Wait for offline readiness and try Chrome's installation menu; availability and wording depend on the browser/device.
5. After testing, remove the forwarding with `adb reverse --remove tcp:4173`.

The initial load and future updates need the Mac server and USB forwarding; a cached app can work offline afterward. This is not a public deployment. A regular `http://<Mac-LAN-IP>:4173` address is **not** a secure context on the phone and will not enable this offline installation flow. For Wi-Fi access, use a properly trusted HTTPS address, not a bypassed certificate warning.

### Updates and cache behavior

Each production build fingerprints and precaches only its HTML, JavaScript, CSS, icons, and manifest, including the separately loaded chart. JSON files selected through file pickers are not placed in the service-worker cache.

An update waits while any cgb-my-savings tab or app window remains open. The bilingual update message asks you to save your JSON file and close **all** cgb-my-savings windows before reopening. There is no forced reload or skip-waiting action that could discard a draft. Older app caches are removed when the new worker activates; unrelated site caches are left alone.

Configure hosting to revalidate `sw.js`, `index.html`, and `manifest.webmanifest` rather than keeping stale copies indefinitely. Fingerprinted `assets/` files can use long-lived immutable caching. Keep a stable origin: language preferences, installation, and offline caches belong to that origin. Clearing site data removes offline availability and requires another online visit.

No hosting account, HTTPS address, or phone installation is created by the local build.

## First check-in

1. Select the month in **Monthly check-in**.
2. Use **+** beside the savings-source dropdown, or **Add source**, to add an account or another savings category.
3. Choose the source's first month to track. It will be expected in monthly totals from that month onward, without affecting earlier months.
4. Enter the end-of-month balance for each active source.
5. Optionally enter **Predicted value**: one expected total across all sources for that month.
6. Click **Add month** to apply the check-in, then **Save JSON** to choose a file and write your data to disk.

For later months, repeat the check-in and click **Save JSON** to update the connected file. Use **Edit** in the history to correct a month, or the editor's delete button to remove it. Corrections and deletions also need **Save JSON** to become permanent.

On your next visit, use **Open JSON** to reconnect your saved file. The app does not automatically reopen files or restore the previous tab's data.

## How the numbers work

| Value                                       | Meaning                                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Total savings                               | The latest month with balances entered for every active source.                                  |
| Monthly change                              | That total minus the previous calendar month's complete total.                                   |
| Percentage change                           | Monthly change divided by the previous month's total; omitted when that total is zero.           |
| Comparison with the previous month's change | The difference between two consecutive monthly changes; needs three consecutive complete months. |
| Predicted value                             | Your manually entered expected total for a month.                                                |
| Vs. prediction                              | Actual complete total minus predicted total. A positive value means ahead of plan.               |

- Leave unknown balances blank. Enter **0** for a known zero balance. Missing balances are never treated as zero.
- Incomplete months appear in history but are not shown as complete total-savings bars.
- You can enter predictions for future months without entering actual balances.
- The overview cards refer to the latest complete month; future predictions remain visible in the history and chart.
- Filtering by source changes the chart and history, not the overall summary cards. Total-only predictions are hidden in filtered views.
- A balance change can include contributions, withdrawals, interest, and investment gains or losses. It is not necessarily income or money contributed.
- The current version uses **EUR only**, accepts nonnegative balances, and supports up to two decimal places. Decimal dots and commas are accepted, but thousands separators are not.

## Files, privacy, and browser support

Saving uses the browser's **File System Access API**. You explicitly choose a JSON file and grant permission to access it. Use desktop Chrome/Edge on HTTPS or localhost, or a compatible up-to-date Chrome for Android on HTTPS or USB-forwarded localhost. Safari, Firefox, and iPhone browsers are not supported for this file workflow. The app shows a warning when the required file-picker APIs are missing.

**Applying a check-in and saving a file are separate steps.** Until you click **Save JSON**, changes exist only in the open tab. The app flags unsaved changes and requests confirmation before discarding them. Do not rely on browser close warnings as a backup.

- Use **Save as new file** after connecting a file to make another copy.
- Invalid or incompatible JSON files are rejected without replacing the current data.
- File-access and write errors are displayed; a failed write does not mark your changes as saved.
- If a connected file has changed outside the app, saving stops instead of overwriting it. Save your current work to a new file, then reopen the original to review its changes.
- Keep backups yourself. JSON files are **plain text and unencrypted**; do not commit financial data or place it in a shared folder unintentionally.
- The application has no analytics, remote fonts, or runtime cloud services. A cloud-synced folder can still upload files through your operating system, independently of this app.

### JSON format

Amounts are stored as **integer cents** to avoid floating-point rounding in financial calculations. The file has a versioned schema:

```json
{
  "version": 1,
  "currency": "EUR",
  "sources": [
    {
      "id": "bank-account",
      "name": "Savings account",
      "startMonth": "2026-01"
    }
  ],
  "snapshots": [
    {
      "month": "2026-01",
      "balances": {
        "bank-account": 2500000
      },
      "predicted": 2450000
    }
  ]
}
```

This example records an actual balance of EUR 25,000.00 and a predicted total of EUR 24,500.00. Use `null` for an unspecified prediction and omit a source's balance when it is unknown. Source IDs must be unique; each month can appear only once.

## Tech stack

| Technology                               | Purpose                                                                                       |
| ---------------------------------------- | --------------------------------------------------------------------------------------------- |
| React 19 + TypeScript 6                  | Component-based UI, typed models, and financial calculations.                                 |
| Vite 8                                   | Local development server and production bundling.                                             |
| Recharts 3                               | Stacked balance bars and the predicted-total line; loaded separately from the main interface. |
| Plain CSS                                | Responsive layouts, dialogs, focus indicators, and reduced-motion support.                    |
| Typed translation dictionaries + Intl    | English/Spanish messages and locale-aware formatting, without an additional dependency.       |
| File System Access API                   | User-authorized JSON file reads and writes, without a backend.                                |
| Web App Manifest + native service worker | Installation, versioned offline app-asset caching, and deferred updates; no PWA dependency.   |
| Vitest + React Testing Library           | Domain, persistence, and user-interaction tests with injected file repositories.              |
| Playwright                               | Chromium checks for persistence, reopening data, and mobile layout.                           |
| ESLint + Prettier                        | Linting and consistent formatting.                                                            |

Exact dependency versions are pinned in `package.json` and `package-lock.json`. `npm ci` installs the locked dependency tree.

## Development checks

```bash
npm test
npm run lint
npm run format:check
npm run build
```

For browser tests, install Chromium once:

```bash
npx playwright install chromium
npm run test:e2e
```

Playwright starts and stops its own local server on port **4175**. Its persistence test uses real browser file handles in browser-managed storage; it does not automate the native operating-system file picker or its permission prompts.

Test the actual production service worker separately:

```bash
npm run test:e2e:pwa
```

This builds the app and runs a production preview on port **4176**, then exercises the manifest/icons, offline reload and chart, JSON file handles, and deferred updates. It does not install an Android WebAPK or validate a physical phone's file provider.

To regenerate the committed install icons from `public/icon.svg`, run `node scripts/generate-icons.mjs` after installing Playwright's Chromium.

Other useful commands:

```bash
npm run test:watch
npm run format
npm audit --registry=https://registry.npmjs.org
```

The explicit audit registry is useful when your configured npm proxy does not implement the audit endpoint.

## Project layout

```text
src/
  App.tsx             Dashboard state and file actions
  model.ts            Money parsing, monthly calculations, JSON validation
  storage.ts          Browser file access and external-change checks
  i18n.ts             English/Spanish messages and language preference
  pwa.ts              Offline registration and update lifecycle
  components/         Chart, history, check-in form, and source dialog
  styles.css          Responsive styling
  *.test.ts(x)        Domain, file persistence, and interface tests
e2e/
  savings.spec.ts     Browser persistence and mobile-layout checks
  pwa.spec.ts         Built-app offline caching and update checks
public/               Install manifest and icons
scripts/              Service worker build/runtime and icon generation
```
