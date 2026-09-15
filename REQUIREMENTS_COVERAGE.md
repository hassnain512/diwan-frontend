# Requirements coverage

| Requirement | Mobile implementation |
|---|---|
| Private login | Splash -> Auth -> Library gate in `App.tsx` |
| Admin OTP | `AuthScreen.tsx` + repository API adapter |
| Reader credentials | `AuthScreen.tsx` + SQLite/REST repository |
| One device | Device ID + reader binding; real cross-device enforcement requires backend |
| Logout purge | Reader logout clears session, books, writings, author snapshot, sync data |
| Books/status | Library + Book Editor |
| Cover upload/generation | Native image picker + generated book cover themes |
| Writing CRUD/status | Writing editor + book/admin flows |
| Manual order | Reorder mode with native up/down movement persisted to SQLite |
| Urdu editor | RTL `TextInput`, HTML source storage, poetry toolbar, preview, autosave |
| HTML content | Stored unchanged in `Writing.content` |
| Book-like reading | Native Reading Screen, classic/dark themes |
| Search | Offline normalized search across titles/content |
| SQLite offline | `expo-sqlite` database |
| Incremental sync foundation | last-sync setting + outbox table + REST adapter |
| Offline admin drafts | Local SQLite draft autosave |
| Last edit wins | ISO `updatedAt` timestamps are retained for server LWW merge |
| Backup | Admin JSON export/restore |
| PDF | Admin-only `expo-print` export |
| Screenshot protection | `expo-screen-capture` on reader screen |
| No reader share/copy | No UI actions; `selectable=false`; screen capture prevented |
| Author profile/stats | Profile + Admin Dashboard |
| Expo Go | Uses Expo SDK modules documented as Expo Go compatible |
| No WebView | No WebView dependency or component |
