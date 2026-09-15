# Vite reference -> native Expo mapping

| Vite reference | Native Expo rebuild |
|---|---|
| `SplashScreen.tsx` | `src/screens/SplashScreen.tsx` |
| `AuthScreen.tsx` | `src/screens/AuthScreen.tsx` |
| `LibraryView.tsx` | `src/screens/LibraryScreen.tsx` |
| `BookCover.tsx` | `src/components/BookCover.tsx` |
| `BookDetailView.tsx` | `src/screens/BookDetailScreen.tsx` |
| `ReadingView.tsx` | `src/screens/ReadingScreen.tsx` + `PoetryHtml.tsx` |
| `AdminDashboard.tsx` | `src/screens/AdminDashboardScreen.tsx` |
| `AdminReadersManagement.tsx` | `src/screens/ReadersScreen.tsx` |
| `BookEditorModal.tsx` | `src/screens/BookEditorScreen.tsx` |
| `UrduEditorModal.tsx` | `src/screens/WritingEditorScreen.tsx` |
| `AuthorProfileModal.tsx` | `src/screens/AuthorProfileScreen.tsx` |
| `FontSelectorModal.tsx` | `src/screens/FontSelectorScreen.tsx` |
| `BookPdfExportModal.tsx` | `src/screens/PdfStudioScreen.tsx` |
| `BackupRestoreModal.tsx` | `src/screens/BackupScreen.tsx` |
| browser `localStorage` | `expo-sqlite` settings/tables |
| `navigator.onLine` | `expo-network` |
| browser print | `expo-print` |
| browser image inputs | `expo-image-picker` / `expo-document-picker` |
| CSS content protection | `expo-screen-capture` + non-selectable native text |
| `dangerouslySetInnerHTML` | native limited HTML poetry renderer (no WebView) |
