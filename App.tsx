import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
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
import { getPalette } from './src/theme/theme';
import { Book, Writing } from './src/types';

export default function App() {
  return <SafeAreaProvider><AppProvider><DiwanApp /></AppProvider></SafeAreaProvider>;
}

type ModalState =
  | { type: 'book'; bookId?: string }
  | { type: 'writing'; bookId: string; writingId?: string }
  | { type: 'author' }
  | { type: 'font' }
  | { type: 'backup' }
  | { type: 'pdf'; bookId?: string }
  | null;

function DiwanApp() {
  const app = useApp();
  const [fontsLoaded, fontError] = useFonts({
    NotoNastaliqUrdu_400Regular,
    NotoNastaliqUrdu_500Medium,
    NotoNastaliqUrdu_600SemiBold,
    NotoNastaliqUrdu_700Bold
  });
  const palette = getPalette(app.readingTheme);
  const [showSplash, setShowSplash] = useState(true);
  const [tab, setTab] = useState<'library' | 'admin' | 'readers'>('library');
  const [bookId, setBookId] = useState<string>();
  const [writingId, setWritingId] = useState<string>();
  const [modal, setModal] = useState<ModalState>(null);

  useEffect(() => { if (app.session) setShowSplash(false); }, [app.session?.token]);
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
    if (!id) return Alert.alert('Create a book first', 'A collection is required before adding a poem.');
    setModal({ type: 'writing', bookId: id });
  };
  const resetNavigation = () => { setBookId(undefined); setWritingId(undefined); };
  const doLogout = () => Alert.alert('Log out?', app.session?.role === 'reader' ? 'Offline library data will be removed from this device.' : 'Your author session will end.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Log out', style: 'destructive', onPress: async () => { await app.logout(); resetNavigation(); setTab('library'); setShowSplash(true); } }]);

  return <SafeAreaView edges={['top', 'bottom']} style={[styles.safe, { backgroundColor: palette.bg }]}>
    <StatusBar style={app.readingTheme === 'dark' ? 'light' : 'dark'} />
    {showAppChrome ? <AppHeader onFont={() => setModal({ type: 'font' })} onAuthor={() => setModal({ type: 'author' })} onTheme={() => app.setTheme(app.readingTheme === 'dark' ? 'classic' : 'dark')} onLogout={doLogout} /> : null}
    <View style={styles.viewport}>
      {book && writing ? <ReadingScreen book={book} writing={writing} onBack={() => setWritingId(undefined)} onSelectWriting={w => setWritingId(w.id)} onFont={() => setModal({ type: 'font' })} />
      : book ? <BookDetailScreen book={book} onBack={() => setBookId(undefined)} onOpenWriting={w => setWritingId(w.id)} onAddWriting={() => addWriting(book.id)} onEditWriting={w => setModal({ type: 'writing', bookId: book.id, writingId: w.id })} onPdf={() => setModal({ type: 'pdf', bookId: book.id })} />
      : tab === 'admin' && app.session.role === 'admin' ? <AdminDashboardScreen onAddBook={() => setModal({ type: 'book' })} onAddWriting={() => addWriting()} onReaders={() => setTab('readers')} onProfile={() => setModal({ type: 'author' })} onBackup={() => setModal({ type: 'backup' })} onPdf={() => setModal({ type: 'pdf' })} onLibrary={() => setTab('library')} />
      : tab === 'readers' && app.session.role === 'admin' ? <ReadersScreen />
      : <LibraryScreen onOpenBook={openBook} onOpenWriting={openWriting} onAddBook={() => setModal({ type: 'book' })} onEditBook={b => setModal({ type: 'book', bookId: b.id })} />}
    </View>
    {showAppChrome ? <BottomNav tab={tab} setTab={next => { resetNavigation(); setTab(next); }} admin={app.session.role === 'admin'} onFont={() => setModal({ type: 'font' })} onAuthor={() => setModal({ type: 'author' })} /> : null}
    <Modal visible={Boolean(modal)} animationType='slide' presentationStyle='pageSheet' onRequestClose={() => setModal(null)}>
      <SafeAreaView edges={['top', 'bottom']} style={[styles.modalRoot, { backgroundColor: palette.bg }]}>
        {modal?.type === 'book' ? <BookEditorScreen book={app.books.find(b => b.id === modal.bookId)} onClose={() => setModal(null)} /> : null}
        {modal?.type === 'writing' ? <WritingEditorScreen bookId={modal.bookId} writing={app.writings.find(w => w.id === modal.writingId)} onClose={() => setModal(null)} /> : null}
        {modal?.type === 'author' ? <AuthorProfileScreen onClose={() => setModal(null)} /> : null}
        {modal?.type === 'font' ? <FontSelectorScreen onClose={() => setModal(null)} /> : null}
        {modal?.type === 'backup' ? <BackupScreen onClose={() => setModal(null)} /> : null}
        {modal?.type === 'pdf' ? <PdfStudioScreen book={app.books.find(b => b.id === modal.bookId)} onClose={() => setModal(null)} /> : null}
      </SafeAreaView>
    </Modal>
  </SafeAreaView>;
}

function AppHeader({ onFont, onAuthor, onTheme, onLogout }: { onFont: () => void; onAuthor: () => void; onTheme: () => void; onLogout: () => void }) {
  const app = useApp();
  const palette = getPalette(app.readingTheme);
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const role = app.session?.role === 'admin' ? 'Author' : 'Reader';
  const stateColor = app.online ? palette.success : palette.warning;

  return <View style={[styles.header, { backgroundColor: palette.surface, borderColor: palette.border, shadowColor: palette.shadow }]}>
    <View style={styles.headerInner}>
      <Pressable accessibilityRole="button" accessibilityLabel="Author profile" onPress={onAuthor} style={({ pressed }) => [styles.identity, pressed && styles.pressed]}>
        <View style={styles.identityCopy}>
          <View style={styles.titleRow}>
            <Image accessible accessibilityLabel="Raza" source={require('./assets/Raza  Logo.png')} resizeMode="contain" style={styles.headerLogo} />
            {!compact ? <View style={[styles.role, { backgroundColor: palette.accentSoft, borderColor: palette.border }]}>
              <Urdu style={[styles.roleText, { color: palette.accentStrong }]}>{role}</Urdu>
            </View> : null}
          </View>
          <View style={styles.online}>
            <View style={[styles.dot, { backgroundColor: stateColor }]} />
            <Urdu numberOfLines={1} style={[styles.onlineText, { color: stateColor }]}>{role + (app.online ? ' • Online' : ' • Offline')}</Urdu>
          </View>
        </View>
      </Pressable>
      <View style={styles.headerActions}>
        {!compact && app.online ? <HeaderIcon name={app.syncing ? 'sync' : 'refresh-outline'} label="Sync" onPress={() => app.sync()} /> : null}
        <HeaderIcon name="text-outline" label="Reading font" onPress={onFont} />
        <HeaderIcon name={app.readingTheme === 'dark' ? 'sunny-outline' : 'moon-outline'} label="Change theme" onPress={onTheme} />
        <HeaderIcon name="log-out-outline" label="Log out" danger onPress={onLogout} />
      </View>
    </View>
  </View>;
}

function HeaderIcon({ name, label, onPress, danger = false }: { name: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; danger?: boolean }) {
  const palette = getPalette(useApp().readingTheme);
  return <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={4} onPress={onPress} style={({ pressed }) => [styles.headerIcon, { borderColor: palette.border, backgroundColor: palette.elevated }, pressed && styles.pressed]}>
    <Ionicons name={name} size={17} color={danger ? palette.danger : palette.accentStrong} />
  </Pressable>;
}
function BottomNav({ tab, setTab, admin, onFont, onAuthor }: { tab: 'library'|'admin'|'readers'; setTab: (t:'library'|'admin'|'readers')=>void; admin:boolean; onFont:()=>void; onAuthor:()=>void }) {
  const palette = getPalette(useApp().readingTheme);
  const items: { key:string; icon:keyof typeof Ionicons.glyphMap; activeIcon:keyof typeof Ionicons.glyphMap; label:string; active:boolean; onPress:()=>void }[] = admin ? [
    { key: 'library', icon: 'library-outline', activeIcon: 'library', label: 'Library', active: tab === 'library', onPress: () => setTab('library') },
    { key: 'admin', icon: 'grid-outline', activeIcon: 'grid', label: 'Dashboard', active: tab === 'admin', onPress: () => setTab('admin') },
    { key: 'readers', icon: 'people-outline', activeIcon: 'people', label: 'Readers', active: tab === 'readers', onPress: () => setTab('readers') }
  ] : [
    { key: 'library', icon: 'library-outline', activeIcon: 'library', label: 'Library', active: true, onPress: () => setTab('library') },
    { key: 'font', icon: 'text-outline', activeIcon: 'text', label: 'Font', active: false, onPress: onFont },
    { key: 'author', icon: 'person-circle-outline', activeIcon: 'person-circle', label: 'Author', active: false, onPress: onAuthor }
  ];

  return <View style={[styles.nav, { backgroundColor: palette.surface, borderColor: palette.border, shadowColor: palette.shadow }]}>
    <View style={styles.navInner}>
      {items.map(item => {
        const active = item.active;
        return <Pressable key={item.key} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={item.onPress} style={({ pressed }) => [styles.navItem, active && { backgroundColor: palette.accentSoft }, pressed && styles.pressed]}>
          <Ionicons name={active ? item.activeIcon : item.icon} size={20} color={active ? palette.accentStrong : palette.muted} />
          <Urdu numberOfLines={1} style={[styles.navLabel, { color: active ? palette.accentStrong : palette.muted }]}>{item.label}</Urdu>
          {active ? <View style={[styles.navMark, { backgroundColor: palette.gold }]} /> : null}
        </Pressable>;
      })}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  safe: { flex: 1 },
  viewport: { flex: 1 },
  modalRoot: { flex: 1 },
  header: {
    minHeight: 66,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: .06,
    shadowRadius: 8,
    elevation: 2,
    zIndex: 10
  },
  headerInner: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    minHeight: 65,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  identity: {
    minWidth: 0,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 13
  },

  identityCopy: { minWidth: 0, flex: 1, alignItems: 'flex-start', justifyContent: 'center' },
  titleRow: { maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 5 },
  headerLogo: { width: 42, height: 42, flexShrink: 0 },
  role: { flexShrink: 0, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999 },
  roleText: { fontSize: 8, lineHeight: 16, fontWeight: '600' },
  online: { maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: -2 },
  onlineText: { minWidth: 0, flexShrink: 1, fontSize: 8, lineHeight: 15 },
  dot: { width: 5, height: 5, flexShrink: 0, borderRadius: 3 },
  headerActions: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  pressed: { opacity: .7, transform: [{ scale: .97 }] },
  nav: {
    minHeight: 64,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 5,
    justifyContent: 'center',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: .06,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10
  },
  navInner: {
    width: '100%',
    maxWidth: 560,
    minHeight: 52,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 6
  },
  navItem: {
    flex: 1,
    minWidth: 0,
    maxWidth: 180,
    minHeight: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    position: 'relative',
    overflow: 'hidden'
  },
  navLabel: { fontSize: 9, lineHeight: 18, fontWeight: '600' },
  navMark: { position: 'absolute', bottom: 2, width: 20, height: 2, borderRadius: 2 }
});

