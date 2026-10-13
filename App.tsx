import React, { useEffect, useState } from 'react';
import { BackHandler, Image, Pressable, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  NotoNastaliqUrdu_400Regular,
  NotoNastaliqUrdu_500Medium,
  NotoNastaliqUrdu_600SemiBold,
  NotoNastaliqUrdu_700Bold
} from '@expo-google-fonts/noto-nastaliq-urdu';
import { AppProvider, useApp } from './src/store/AppContext';
import { SplashScreen } from './src/screens/SplashScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { BookDetailScreen } from './src/screens/BookDetailScreen';
import { ReadingScreen } from './src/screens/ReadingScreen';
import { AdminDashboardScreen } from './src/screens/AdminDashboardScreen';
import { ReadersScreen } from './src/screens/ReadersScreen';
import { BookEditorScreen } from './src/screens/BookEditorScreen';
import { WritingEditorScreen } from './src/screens/WritingEditorScreen';
import { AuthorProfileScreen } from './src/screens/AuthorProfileScreen';
import { FontSelectorScreen } from './src/screens/FontSelectorScreen';
import { BackupScreen } from './src/screens/BackupScreen';
import { PdfStudioScreen } from './src/screens/PdfStudioScreen';
import { Loading, Urdu } from './src/components/Ui';
import { AppSheet, DialogProvider, useDialog } from './src/components/Dialog';
import { getPalette } from './src/theme/theme';
import { Book, Writing } from './src/types';

export default function App() {
  return <SafeAreaProvider><AppProvider><DialogProvider><DiwanApp /></DialogProvider></AppProvider></SafeAreaProvider>;
}

type ModalState =
  | { type: 'book'; bookId?: string }
  | { type: 'writing'; bookId: string; writingId?: string }
  | { type: 'font' }
  | null;

type AppTab = 'library' | 'admin' | 'readers' | 'reading' | 'author' | 'profile' | 'pdf' | 'backup';

function DiwanApp() {
  const app = useApp();
  const dialog = useDialog();
  const [fontsLoaded, fontError] = useFonts({
    NotoNastaliqUrdu_400Regular,
    NotoNastaliqUrdu_500Medium,
    NotoNastaliqUrdu_600SemiBold,
    NotoNastaliqUrdu_700Bold
  });
  const palette = getPalette(app.readingTheme);
  const [showSplash, setShowSplash] = useState(true);
  const [tab, setTab] = useState<AppTab>('library');
  const [bookId, setBookId] = useState<string>();
  const [writingId, setWritingId] = useState<string>();
  const [pdfBookId, setPdfBookId] = useState<string>();
  const [modal, setModal] = useState<ModalState>(null);

  useEffect(() => { if (app.session) setShowSplash(false); }, [app.session?.token]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      // Always unwind the app's own navigation state before allowing Android to exit.
      if (modal) {
        setModal(null);
        return true;
      }
      if (!app.session) {
        if (!showSplash) {
          setShowSplash(true);
          return true;
        }
        return false;
      }
      if (writingId) {
        setWritingId(undefined);
        return true;
      }
      if (bookId) {
        setBookId(undefined);
        return true;
      }
      if (tab !== 'library') {
        setTab(app.session.role === 'admin' ? 'admin' : 'library');
        return true;
      }
      return false;
    });

    return () => subscription.remove();
  }, [app.session, bookId, modal, showSplash, tab, writingId]);
  const book = app.books.find(b => b.id === bookId);
  const writing = app.writings.find(w => w.id === writingId);
  const showAppChrome = !book;

  if (!app.ready || (!fontsLoaded && !fontError)) return <Loading />;
  if (showSplash) return <SplashScreen onEnter={() => setShowSplash(false)} authorName={app.author?.authorName || 'Hassnain Raza Maitla'} penName="RAZA" />;
  if (!app.session) return <AuthScreen onBack={() => setShowSplash(true)} />;

  const openBook = (b: Book) => { setBookId(b.id); setWritingId(undefined); };
  const openWriting = (b: Book, w: Writing) => { setBookId(b.id); setWritingId(w.id); };
  const addWriting = (targetBookId?: string) => {
    const id = targetBookId || bookId || app.books[0]?.id;
    if (!id) { void dialog.alert({ title: 'Create a book first', message: 'A collection is required before adding a poem.', tone: 'info', icon: 'book-outline' }); return; }
    setModal({ type: 'writing', bookId: id });
  };
  const resetNavigation = () => { setBookId(undefined); setWritingId(undefined); };
  const openPage = (next: AppTab) => { resetNavigation(); if (next !== 'pdf') setPdfBookId(undefined); setTab(next); };
  const openPdfPage = (targetBookId?: string) => { resetNavigation(); setPdfBookId(targetBookId); setTab('pdf'); };
  const doLogout = async () => {
    const confirmed = await dialog.confirm({ title: 'Log out?', message: app.session?.role === 'reader' ? 'Offline library data will be removed from this device.' : 'Your author session will end.', confirmLabel: 'Log out', destructive: true, tone: 'danger', icon: 'log-out-outline' });
    if (!confirmed) return;
    await app.logout(); resetNavigation(); setTab('library'); setShowSplash(true);
  };

  return <>
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safe, { backgroundColor: palette.bg }]}>
      <StatusBar style={app.readingTheme === 'dark' ? 'light' : 'dark'} />
      {showAppChrome ? <AppHeader onAuthor={() => openPage(app.session?.role === 'admin' ? 'profile' : 'author')} onTheme={() => app.setTheme(app.readingTheme === 'dark' ? 'classic' : 'dark')} onLogout={doLogout} /> : null}
      <View style={styles.viewport}>
        {book && writing ? <ReadingScreen book={book} writing={writing} onBack={() => setWritingId(undefined)} onSelectWriting={w => setWritingId(w.id)} onFont={() => setModal({ type: 'font' })} />
        : book ? <BookDetailScreen book={book} onBack={() => setBookId(undefined)} onOpenWriting={w => setWritingId(w.id)} onAddWriting={() => addWriting(book.id)} onEditWriting={w => setModal({ type: 'writing', bookId: book.id, writingId: w.id })} onPdf={() => openPdfPage(book.id)} />
        : tab === 'admin' && app.session.role === 'admin' ? <AdminDashboardScreen onAddBook={() => setModal({ type: 'book' })} onAddWriting={() => addWriting()} onReaders={() => openPage('readers')} onProfile={() => openPage('profile')} onBackup={() => openPage('backup')} onPdf={() => openPdfPage()} onLibrary={() => openPage('library')} />
        : tab === 'readers' && app.session.role === 'admin' ? <ReadersScreen />
        : tab === 'profile' && app.session.role === 'admin' ? <AuthorProfileScreen />
        : tab === 'pdf' && app.session.role === 'admin' ? <PdfStudioScreen book={app.books.find(item => item.id === pdfBookId)} />
        : tab === 'backup' && app.session.role === 'admin' ? <BackupScreen />
        : tab === 'reading' && app.session.role === 'reader' ? <FontSelectorScreen />
        : tab === 'author' && app.session.role === 'reader' ? <AuthorProfileScreen />
        : <LibraryScreen onOpenBook={openBook} onOpenWriting={openWriting} onAddBook={() => setModal({ type: 'book' })} onEditBook={b => setModal({ type: 'book', bookId: b.id })} />}
      </View>
      {showAppChrome ? <BottomNav tab={tab} setTab={openPage} admin={app.session.role === 'admin'} /> : null}
    </SafeAreaView>
    <AppSheet visible={Boolean(modal)} onDismiss={() => setModal(null)}>
      <View style={[styles.modalRoot, { backgroundColor: palette.bg }]}>
        {modal?.type === 'book' ? <BookEditorScreen book={app.books.find(b => b.id === modal.bookId)} onClose={() => setModal(null)} /> : null}
        {modal?.type === 'writing' ? <WritingEditorScreen bookId={modal.bookId} writing={app.writings.find(w => w.id === modal.writingId)} onClose={() => setModal(null)} /> : null}
        {modal?.type === 'font' ? <FontSelectorScreen onClose={() => setModal(null)} /> : null}
      </View>
    </AppSheet>
  </>;
}

function AppHeader({ onAuthor, onTheme, onLogout }: { onAuthor: () => void; onTheme: () => void; onLogout: () => void }) {
  const app = useApp();
  const dialog = useDialog();
  const palette = getPalette(app.readingTheme);
  const role = app.session?.role === 'admin' ? 'Author' : 'Reader';

  return <View style={[styles.header, { backgroundColor: palette.surface, borderColor: palette.border }]}>
    <View style={styles.headerInner}>
      <Pressable accessibilityRole="button" accessibilityLabel="Author profile" android_ripple={{ color: palette.border }} onPress={onAuthor} style={({ pressed }) => [styles.identity, pressed && styles.pressed]}>
        <Image accessible accessibilityLabel="Raza" source={require('./assets/Raza  Logo.png')} resizeMode="contain" style={styles.headerLogo} />
        <View style={styles.identityCopy}>
          <Urdu numberOfLines={1} style={styles.appName}>Kalam e Raza</Urdu>
          <View style={styles.roleLine}><View style={[styles.dot,{backgroundColor:app.online?palette.success:palette.warning}]}/><Urdu numberOfLines={1} style={[styles.roleText,{color:palette.muted}]}>{role}{app.online?' · Online':' · Offline'}</Urdu></View>
        </View>
      </Pressable>
      <View style={styles.headerActions}>
        <HeaderIcon name={app.readingTheme === 'dark' ? 'sunny-outline' : 'moon-outline'} label="Change theme" onPress={onTheme} />
        <HeaderIcon name="person-circle-outline" label="Author profile" onPress={onAuthor} />
        <HeaderIcon name="log-out-outline" label="Log out" danger onPress={onLogout} />
      </View>
    </View>
  </View>;
}

function HeaderIcon({ name, label, onPress, danger = false }: { name: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; danger?: boolean }) {
  const palette = getPalette(useApp().readingTheme);
  return <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={8} android_ripple={{ color: palette.border, borderless: true }} onPress={onPress} style={({ pressed }) => [styles.headerIcon, pressed && styles.pressed]}>
    <Ionicons name={name} size={20} color={danger ? palette.danger : palette.accentStrong} />
  </Pressable>;
}
function BottomNav({ tab, setTab, admin }: { tab: AppTab; setTab: (tab: AppTab) => void; admin: boolean }) {
  const palette = getPalette(useApp().readingTheme);
  const items: { key:string; icon:keyof typeof Ionicons.glyphMap; activeIcon:keyof typeof Ionicons.glyphMap; label:string; active:boolean; onPress:()=>void }[] = admin ? [
    { key: 'library', icon: 'library-outline', activeIcon: 'library', label: 'Library', active: tab === 'library', onPress: () => setTab('library') },
    { key: 'admin', icon: 'create-outline', activeIcon: 'create', label: 'Studio', active: tab === 'admin', onPress: () => setTab('admin') },
    { key: 'readers', icon: 'people-outline', activeIcon: 'people', label: 'Readers', active: tab === 'readers', onPress: () => setTab('readers') }
  ] : [
    { key: 'library', icon: 'library-outline', activeIcon: 'library', label: 'Library', active: tab === 'library', onPress: () => setTab('library') },
    { key: 'reading', icon: 'text-outline', activeIcon: 'text', label: 'Reading', active: tab === 'reading', onPress: () => setTab('reading') },
    { key: 'author', icon: 'person-circle-outline', activeIcon: 'person-circle', label: 'Author', active: tab === 'author', onPress: () => setTab('author') }
  ];

  return <View style={[styles.nav, { backgroundColor: palette.surface, borderColor: palette.border }]}>
    <View style={styles.navInner}>
      {items.map(item => <Pressable key={item.key} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: item.active }} android_ripple={{ color: palette.border }} onPress={item.onPress} style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}>
        <View style={styles.navIconWrap}><Ionicons name={item.active ? item.activeIcon : item.icon} size={20} color={item.active ? palette.accentStrong : palette.muted} /></View>
        <Urdu numberOfLines={1} style={[styles.navLabel, { color: item.active ? palette.accentStrong : palette.muted }]}>{item.label}</Urdu>
      </Pressable>)}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  safe: { flex: 1 },
  viewport: { flex: 1 },
  modalRoot: { flex: 1 },
  header: { minHeight: 64, borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, justifyContent: 'center', zIndex: 10 },
  headerInner: { width: '100%', maxWidth: 760, alignSelf: 'center', minHeight: 63, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  identity: { minWidth: 0, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 12, overflow: 'hidden' },
  identityCopy: { minWidth: 0, flex: 1, justifyContent: 'center' },
  headerLogo: { width: 38, height: 38, flexShrink: 0 },
  appName: { fontSize: 14, lineHeight: 27, fontWeight: '700' },
  roleLine: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: -4 },
  roleText: { fontSize: 8, lineHeight: 16 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  headerActions: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 2 },
  headerIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  pressed: { opacity: .68, transform: [{ scale: .97 }] },
  nav: { minHeight: 66, borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingTop: 5, paddingBottom: 5, justifyContent: 'center', zIndex: 10 },
  navInner: { width: '100%', maxWidth: 520, minHeight: 54, alignSelf: 'center', flexDirection: 'row', alignItems: 'stretch', justifyContent: 'center' },
  navItem: { flex: 1, minWidth: 0, minHeight: 54, alignItems: 'center', justifyContent: 'center', gap: 1, borderRadius: 14, overflow: 'hidden' },
  navIconWrap: { width: 42, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 9, lineHeight: 18, fontWeight: '600' }
});
