# Diwan — Private Urdu Poetry Library (React Native + Expo Go)

A brand-new **native React Native / Expo SDK 57 / TypeScript** rebuild of the attached Vite reference application. It does **not** embed the website and does **not** use a WebView.

## What is implemented

- Author-branded splash and private login gate
- Reader username/password login with device binding behavior
- Admin email + OTP flow (demo mode auto-exposes the generated OTP, same idea as the reference repo)
- Reader/admin roles and role-specific navigation
- Native mobile bookshelf with generated/custom covers
- Draft / Coming Soon / Published book states
- Draft / Published writing states
- Urdu offline search across books, writing titles and poetry content
- Book writing index and author-controlled ordering
- Native Urdu writing editor with HTML storage, RTL input, poetry toolbar, preview and draft autosave
- Classic and dark literary reading themes
- Reader content screen-capture prevention via `expo-screen-capture`
- No reader copy/share/PDF actions
- Author profile editing and image picking
- Reader management: create, activate/deactivate, device reset, delete
- SQLite offline database and persisted settings
- Reader logout cache purge
- Offline outbox table ready for backend synchronization
- Admin PDF export with `expo-print`
- Admin JSON backup/export and restore
- Optional REST API mode through `EXPO_PUBLIC_API_URL`

## Run with Expo Go

> Expo SDK 57 requires a modern Node.js. Expo currently documents Node **22.13+** for SDK 57.

```bash
cd diwan_expo_mobile
npm install
npx expo install --fix
npx expo-doctor@latest
npx expo start
```

Scan the QR code with Expo Go (or open Android/iOS simulator).

## Demo credentials

### Reader

- `ahmed` / `urdu123`
- `fatima` / `shair786`

### Admin

Use the prefilled author email. In local demo mode an OTP is generated and shown in the app so the complete flow can be tested without an email provider.

## Backend mode

A production-ready TypeScript API, Supabase migrations, secure authentication, Storage uploads, backup/restore, and offline synchronization are included under `backend/` and `supabase/`. Follow [`BACKEND_SETUP.md`](./BACKEND_SETUP.md) for provisioning and deployment.

Copy `.env.example` to `.env` and set:

```env
EXPO_PUBLIC_API_URL=http://YOUR-LAN-IP:5003
```

Do **not** use `localhost` when testing on a physical phone. Use the computer's LAN IP, for example `http://192.168.1.20:5003`.

The mobile app uses the included REST API for OTP authentication, device-bound readers, library CRUD, media, backups, and bidirectional offline synchronization. If `EXPO_PUBLIC_API_URL` is empty, the app runs as a fully local Expo Go demo backed by SQLite.

## Important production notes

1. **True one-account/one-device enforcement must be server-side.** Local demo mode can demonstrate device binding on one installation, but only a centralized backend can reject the same account on another physical phone.
2. **OTP email delivery must be implemented by the backend.** Never ship SMTP credentials or an email API secret in the mobile bundle.
3. **Reader passwords must be hashed on the real server/database.** The local seed credentials exist only for UI/demo parity with the supplied reference.
4. **Screenshot blocking is best-effort by OS capability.** External cameras can never be prevented.
5. The project stores rich poetry as HTML, but renders it natively (no WebView). The supported editor tags are intentionally poetry-focused.

## Urdu fonts

The font selector includes Noto Nastaliq Urdu, Jameel Noori Nastaleeq and Mehr Nastaliq preferences to preserve the reference UX. This source package intentionally does **not** redistribute third-party font files. For a production offline build, add your licensed font files under `assets/fonts/` and load them with `expo-font`; then map the selected preference in `ReadingScreen.tsx` and shared Urdu text components.

## Project structure

```text
App.tsx
src/
  components/     shared native UI, book cover, status chip
  screens/        splash, auth, library, reading, editors, admin, readers, PDF, backup
  services/       SQLite, session, device id, local/remote repository
  store/          application context and synchronization orchestration
  theme/          design tokens copied from the Vite visual language
  utils/          HTML/plain-text conversion and Urdu search normalization
```

## No WebView

There is no `react-native-webview` dependency and no web page is embedded. All visible screens use React Native primitives (`View`, `Text`, `TextInput`, `Image`, `Pressable`, `FlatList`, `ScrollView`).
"# diwan-frontend" 
