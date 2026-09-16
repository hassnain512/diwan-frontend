import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Book, Writing } from '../types';
import { useApp } from '../store/AppContext';
import { BookCover } from '../components/BookCover';
import { StatusChip } from '../components/StatusChip';
import { Button, Card, Urdu } from '../components/Ui';
import { fontFamilies, getPalette } from '../theme/theme';
import { normalizeForSearch } from '../utils/html';

type Filter = 'all' | 'published' | 'coming_soon' | 'draft';

export function LibraryScreen({ onOpenBook, onOpenWriting, onAddBook, onEditBook }: { onOpenBook: (book: Book) => void; onOpenWriting: (book: Book, writing: Writing) => void; onAddBook: () => void; onEditBook: (book: Book) => void }) {
  const app = useApp();
  const { width } = useWindowDimensions();
  const columns = width >= 700 ? 3 : 2;
  const { books, writings, author, session } = app;
  const palette = getPalette(app.readingTheme);
  const isAdmin = session?.role === 'admin';
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const q = normalizeForSearch(query);
  const visibleBooks = useMemo(() => books.filter(b => isAdmin || b.status !== 'draft'), [books, isAdmin]);
  const filtered = useMemo(() => visibleBooks.filter(b => filter === 'all' || b.status === filter), [visibleBooks, filter]);
  const resultBooks = useMemo(() => q ? visibleBooks.filter(b => normalizeForSearch(b.title).includes(q)) : [], [q, visibleBooks]);
  const resultWritings = useMemo(() => q ? writings
    .filter(w => (isAdmin || w.status === 'published') && (normalizeForSearch(w.title).includes(q) || normalizeForSearch(w.content).includes(q)))
    .map(w => ({ writing: w, book: books.find(b => b.id === w.bookId) }))
    .filter(x => x.book && (isAdmin || x.book.status === 'published')) as { writing: Writing; book: Book }[] : [], [q, writings, books, isAdmin]);

  const open = (book: Book) => {
    if (!isAdmin && book.status === 'coming_soon') return Alert.alert('Coming soon', `“${book.title}” is not available yet.`);
    onOpenBook(book);
  };
  const filterLabels: Record<Filter, string> = { all: 'All', published: 'Published', coming_soon: 'Coming soon', draft: 'Drafts' };
  const filters: Filter[] = ['all', 'published', 'coming_soon', ...(isAdmin ? ['draft' as const] : [])];
  const onAccent = palette.dark ? '#11120F' : '#FFFCF7';

  if (q) {
    const results = [...resultBooks.map(book => ({ type: 'book' as const, book })), ...resultWritings.map(item => ({ type: 'writing' as const, ...item }))];
    return <FlatList
      style={[styles.root, { backgroundColor: palette.bg }]}
      contentContainerStyle={styles.content}
      data={results}
      keyExtractor={item => item.type === 'book' ? `b-${item.book.id}` : `w-${item.writing.id}`}
      ListHeaderComponent={<>
        <Search value={query} onChange={setQuery} />
        <View style={styles.resultHead}>
          <Urdu style={[styles.resultEyebrow, { color: palette.muted }]}>Search results</Urdu>
          <Urdu style={styles.resultTitle}>“{query}”</Urdu>
        </View>
      </>}
      ListEmptyComponent={<Card style={styles.emptyCard}><Ionicons name="search-outline" size={28} color={palette.muted} /><Urdu style={[styles.empty, { color: palette.muted }]}>No results found</Urdu></Card>}
      renderItem={({ item }) => item.type === 'book' ? <Pressable onPress={() => open(item.book)} style={({ pressed }) => [styles.searchCard, { backgroundColor: palette.surface, borderColor: palette.border }, pressed && styles.pressed]}>
        <View style={styles.resultCover}><BookCover compact book={item.book} authorName={author?.authorNameUrdu} /></View>
        <View style={styles.resultBody}><Urdu style={styles.searchTitle}>{item.book.title}</Urdu><StatusChip status={item.book.status} /><Urdu style={[styles.muted, { color: palette.muted }]}>{writings.filter(w => w.bookId === item.book.id).length} poems</Urdu></View>
        <Ionicons name="chevron-forward" size={18} color={palette.muted} />
      </Pressable> : <Pressable onPress={() => onOpenWriting(item.book, item.writing)} style={({ pressed }) => [styles.searchCard, { backgroundColor: palette.surface, borderColor: palette.border }, pressed && styles.pressed]}>
        <View style={[styles.docIcon, { backgroundColor: palette.accentSoft }]}><Ionicons name="document-text-outline" size={25} color={palette.accent} /></View>
        <View style={styles.resultBody}><Urdu style={styles.searchTitle}>{item.writing.title}</Urdu><Urdu style={[styles.muted, { color: palette.muted }]}>{item.book.title} • Poem</Urdu></View>
        <Ionicons name="chevron-forward" size={18} color={palette.muted} />
      </Pressable>}
    />;
  }

  return <FlatList
    style={[styles.root, { backgroundColor: palette.bg }]}
    contentContainerStyle={styles.content}
    data={filtered}
    key={`library-${columns}`}
    numColumns={columns}
    columnWrapperStyle={styles.row}
    showsVerticalScrollIndicator={false}
    keyExtractor={book => book.id}
    ListHeaderComponent={<>
      <View style={styles.headingRow}>
        <View style={styles.headingText}>
          <Urdu style={styles.heading}>Library</Urdu>
        </View>
        <View style={[styles.headingIcon, { backgroundColor: palette.accentSoft }]}><Ionicons name="sparkles-outline" size={21} color={palette.accent} /></View>
      </View>
      <Search value={query} onChange={setQuery} />
      <View style={styles.filterRow}>
        <View style={styles.filters}>{filters.map(item => <Pressable key={item} accessibilityRole="tab" accessibilityLabel={filterLabels[item]} accessibilityState={{ selected: filter === item }} onPress={() => setFilter(item)} style={({ pressed }) => [styles.filter, { backgroundColor: palette.surface, borderColor: palette.border }, filter === item && { backgroundColor: palette.accent, borderColor: palette.accent }, pressed && styles.pressed]}>
          <Urdu numberOfLines={1} style={[styles.filterText, { color: filter === item ? onAccent : palette.muted }]}>{filterLabels[item]}</Urdu>
        </Pressable>)}</View>
      </View>
      <View style={styles.sectionHead}>
        <View style={styles.sectionText}><Urdu style={styles.sectionTitle}>Collections</Urdu><Urdu style={[styles.sectionCount, { color: palette.muted }]}>{filtered.length} total</Urdu></View>
        {isAdmin ? <Button compact variant="secondary" icon="add" title="New book" onPress={onAddBook} /> : null}
      </View>
    </>}
    renderItem={({ item }) => <View style={[styles.bookCell, { width: columns === 3 ? '31.4%' : '47.5%' }]}>
      <Pressable onPress={() => open(item)} style={({ pressed }) => [styles.bookPress, pressed && styles.pressed]}>
        <View style={styles.coverWrap}>
          <BookCover book={item} authorName={author?.authorNameUrdu} />
          {isAdmin ? <Pressable accessibilityLabel="Edit book" onPress={() => onEditBook(item)} style={[styles.edit, { backgroundColor: palette.elevated, borderColor: palette.border }]}><Ionicons name="create-outline" size={15} color={palette.accent} /></Pressable> : null}
        </View>
        <View style={styles.bookMeta}>
          <Urdu numberOfLines={1} style={styles.bookTitle}>{item.title}</Urdu>
          <Urdu style={[styles.bookCount, { color: palette.muted }]}>{writings.filter(w => w.bookId === item.id && (isAdmin || w.status === 'published')).length} poems</Urdu>
          <StatusChip status={item.status} />
        </View>
      </Pressable>
    </View>}
    ListEmptyComponent={<Card style={styles.emptyCard}><Ionicons name="library-outline" size={30} color={palette.muted} /><Urdu style={[styles.empty, { color: palette.muted }]}>No books here yet</Urdu></Card>}
  />;
}

function Search({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const app = useApp();
  const { width } = useWindowDimensions();
  const columns = width >= 700 ? 3 : 2;
  const palette = getPalette(app.readingTheme);
  return <View style={[styles.search, { backgroundColor: palette.input, borderColor: palette.border, shadowColor: palette.shadow }]}>
    <Ionicons name="search-outline" size={19} color={palette.muted} />
    <TextInput value={value} onChangeText={onChange} selectionColor={palette.accent} placeholder="Search books and poems" placeholderTextColor={palette.muted} style={[styles.searchInput, { color: palette.text }]} />
    {value ? <Pressable onPress={() => onChange('')}><Ionicons name="close-circle" size={19} color={palette.muted} /></Pressable> : null}
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 112 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  headingText: { flex: 1, alignItems: 'flex-start' },
  heading: { fontSize: 25, lineHeight: 42, fontWeight: '700' },
  headingSub: { fontSize: 10, lineHeight: 21, marginTop: -4 },
  headingIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  search: { minHeight: 48, borderWidth: 1, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 13, shadowOffset: { width: 0, height: 5 }, shadowOpacity: .04, shadowRadius: 12, elevation: 1 },
  searchInput: { flex: 1, minHeight: 46, textAlign: 'left', writingDirection: 'ltr', fontSize: 13, lineHeight: 20, paddingVertical: 5 },
  hero: { minHeight: 104, marginTop: 15, borderWidth: 1, borderRadius: 20, padding: 15, flexDirection: 'row-reverse', alignItems: 'center', overflow: 'hidden', shadowOffset: { width: 0, height: 7 }, shadowOpacity: .05, shadowRadius: 16, elevation: 1 },
  heroMark: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  heroPen: { fontSize: 17, lineHeight: 31, fontWeight: '700' },
  heroBody: { flex: 1, alignItems: 'flex-end', paddingHorizontal: 13 },
  heroOverline: { fontSize: 9, lineHeight: 19 },
  heroTitle: { fontSize: 18, lineHeight: 32, fontWeight: '700', marginTop: -2 },
  heroName: { fontSize: 10, lineHeight: 21, marginTop: -2 },
  heroRule: { position: 'absolute', right: 0, top: 19, bottom: 19, width: 2, borderRadius: 2 },
  filterRow: { marginVertical: 14 },
  filters: { flexDirection: 'row', alignItems: 'stretch', gap: 7 },
  filter: { flex: 1, minWidth: 0, minHeight: 44, paddingHorizontal: 5, paddingVertical: 3, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  filterText: { flexShrink: 1, fontSize: 11, lineHeight: 18, fontWeight: '700', textAlign: 'center' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, marginBottom: 13 },
  sectionText: { alignItems: 'flex-start' },
  sectionTitle: { fontSize: 20, lineHeight: 35, fontWeight: '700' },
  sectionCount: { fontSize: 9, lineHeight: 19, marginTop: -5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 14 },
  bookCell: { marginBottom: 24 },
  bookPress: { width: '100%' },
  coverWrap: { width: '100%', position: 'relative', paddingRight: 5 },
  bookMeta: { marginTop: 9, alignItems: 'center', gap: 2 },
  bookTitle: { width: '100%', textAlign: 'center', fontSize: 16, lineHeight: 30, fontWeight: '700' },
  bookCount: { fontSize: 9, lineHeight: 19, marginTop: -4, marginBottom: 3 },
  edit: { position: 'absolute', left: 6, top: 7, width: 40, height: 40, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center', elevation: 3 },
  pressed: { opacity: .72, transform: [{ scale: .985 }] },
  resultHead: { alignItems: 'flex-start', marginVertical: 17 },
  resultEyebrow: { fontSize: 10, lineHeight: 20 },
  resultTitle: { fontSize: 21, lineHeight: 36, fontWeight: '700' },
  searchCard: { minHeight: 112, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 19, padding: 11, marginBottom: 10 },
  resultCover: { width: 86 },
  resultBody: { flex: 1, alignItems: 'flex-start', gap: 5 },
  searchTitle: { fontSize: 17, lineHeight: 31, fontWeight: '700' },
  muted: { fontSize: 9, lineHeight: 19 },
  docIcon: { width: 74, height: 82, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  emptyCard: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 28, marginBottom: 14 },
  empty: { textAlign: 'center', fontSize: 12, lineHeight: 25 }
});


