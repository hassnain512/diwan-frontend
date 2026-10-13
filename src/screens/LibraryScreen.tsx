import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Book, Writing } from '../types';
import { useApp } from '../store/AppContext';
import { BookCover } from '../components/BookCover';
import { useDialog } from '../components/Dialog';
import { StatusChip } from '../components/StatusChip';
import { Button, EmptyState, Label, Urdu } from '../components/Ui';
import { getPalette, layout, radii, spacing, typography } from '../theme/theme';
import { normalizeForSearch } from '../utils/html';

type Filter = 'all' | 'published' | 'coming_soon' | 'draft';

export function LibraryScreen({ onOpenBook, onOpenWriting, onAddBook, onEditBook }: { onOpenBook: (book: Book) => void; onOpenWriting: (book: Book, writing: Writing) => void; onAddBook: () => void; onEditBook: (book: Book) => void }) {
  const app = useApp();
  const dialog = useDialog();
  const { width } = useWindowDimensions();
  const columns = width >= 700 ? 3 : 2;
  const { books, writings, author, session } = app;
  const palette = getPalette(app.readingTheme);
  const isAdmin = session?.role === 'admin';
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const q = normalizeForSearch(query);
  const visibleBooks = useMemo(() => books.filter(book => isAdmin || book.status !== 'draft'), [books, isAdmin]);
  const filtered = useMemo(() => visibleBooks.filter(book => filter === 'all' || book.status === filter), [visibleBooks, filter]);
  const resultBooks = useMemo(() => q ? visibleBooks.filter(book => normalizeForSearch(book.title).includes(q)) : [], [q, visibleBooks]);
  const resultWritings = useMemo(() => q ? writings
    .filter(writing => (isAdmin || writing.status === 'published') && (normalizeForSearch(writing.title).includes(q) || normalizeForSearch(writing.content).includes(q)))
    .map(writing => ({ writing, book: books.find(book => book.id === writing.bookId) }))
    .filter(item => item.book && (isAdmin || item.book.status === 'published')) as { writing: Writing; book: Book }[] : [], [q, writings, books, isAdmin]);

  const poemCount = (book: Book) => writings.filter(writing => writing.bookId === book.id && (isAdmin || writing.status === 'published')).length;
  const open = (book: Book) => {
    if (!isAdmin && book.status === 'coming_soon') { void dialog.alert({ title: 'Coming soon', message: `“${book.title}” is not available yet.`, tone: 'info', icon: 'time-outline' }); return; }
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
      keyExtractor={item => item.type === 'book' ? `book-${item.book.id}` : `writing-${item.writing.id}`}
      ListHeaderComponent={<>
        <LibraryHeader authorName={author?.authorNameUrdu || author?.authorName} />
        <Search value={query} onChange={setQuery} />
        <View style={styles.searchHeading}>
          <Label style={{ color: palette.muted }}>Search results</Label>
          <Urdu style={styles.searchQuery}>“{query}”</Urdu>
        </View>
      </>}
      ListEmptyComponent={<EmptyState icon="search-outline" title="No results found" message="Try another book title, poem title, or phrase." />}
      renderItem={({ item }) => item.type === 'book'
        ? <Pressable onPress={() => open(item.book)} style={({ pressed }) => [styles.resultRow, { borderBottomColor: palette.border }, pressed && styles.pressed]}>
          <View style={styles.resultCover}><BookCover compact book={item.book} authorName={author?.authorNameUrdu} /></View>
          <View style={styles.resultCopy}>
            <Urdu style={styles.resultTitle}>{item.book.title}</Urdu>
            <Label style={{ color: palette.muted }}>{poemCount(item.book)} poems</Label>
            {isAdmin ? <StatusChip status={item.book.status} /> : null}
          </View>
          <Ionicons name="chevron-forward" size={18} color={palette.muted} />
        </Pressable>
        : <Pressable onPress={() => onOpenWriting(item.book, item.writing)} style={({ pressed }) => [styles.resultRow, { borderBottomColor: palette.border }, pressed && styles.pressed]}>
          <View style={[styles.poemIcon, { backgroundColor: palette.accentSoft }]}><Ionicons name="document-text-outline" size={22} color={palette.accent} /></View>
          <View style={styles.resultCopy}>
            <Urdu style={styles.resultTitle}>{item.writing.title}</Urdu>
            <Urdu style={[styles.resultBook, { color: palette.muted }]}>{item.book.title}</Urdu>
          </View>
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
      <LibraryHeader authorName={author?.authorNameUrdu || author?.authorName} />
      <Search value={query} onChange={setQuery} />
      {isAdmin ? <View style={styles.filters}>{filters.map(item => <Pressable
        key={item}
        accessibilityRole="tab"
        accessibilityLabel={filterLabels[item]}
        accessibilityState={{ selected: filter === item }}
        onPress={() => setFilter(item)}
        style={({ pressed }) => [styles.filter, { borderColor: palette.border }, filter === item && { backgroundColor: palette.accent, borderColor: palette.accent }, pressed && styles.pressed]}
      >
        <Label style={[styles.filterText, { color: filter === item ? onAccent : palette.muted }]}>{filterLabels[item]}</Label>
      </Pressable>)}</View> : null}
      <View style={styles.sectionHead}>
        <View>
          <Urdu style={styles.sectionTitle}>Collections</Urdu>
          <Label style={{ color: palette.muted }}>{filtered.length} {filtered.length === 1 ? 'collection' : 'collections'}</Label>
        </View>
        {isAdmin ? <Button compact variant="secondary" icon="add" title="New book" onPress={onAddBook} /> : null}
      </View>
    </>}
    renderItem={({ item }) => <View style={[styles.bookCell, { width: columns === 3 ? '31.5%' : '47.6%' }]}>
      <Pressable onPress={() => open(item)} style={({ pressed }) => [styles.bookPress, pressed && styles.pressed]}>
        <View style={styles.coverWrap}>
          <BookCover book={item} authorName={author?.authorNameUrdu} />
          {isAdmin ? <Pressable accessibilityRole="button" accessibilityLabel="Edit book" hitSlop={8} android_ripple={{ color: palette.border, borderless: true }} onPress={() => onEditBook(item)} style={[styles.edit, { backgroundColor: palette.elevated, borderColor: palette.border }]}><Ionicons name="ellipsis-horizontal" size={18} color={palette.accent} /></Pressable> : null}
        </View>
        <View style={styles.bookMeta}>
          <Urdu numberOfLines={2} style={styles.bookTitle}>{item.title}</Urdu>
          <Label style={{ color: palette.muted }}>{poemCount(item)} poems</Label>
          {isAdmin ? <View style={styles.statusWrap}><StatusChip status={item.status} /></View> : null}
        </View>
      </Pressable>
    </View>}
    ListEmptyComponent={<EmptyState icon="library-outline" title="No collections yet" message={isAdmin ? 'Create the first collection to begin your library.' : 'There are no published collections yet.'} action={isAdmin ? <Button title="New book" icon="add" onPress={onAddBook} /> : undefined} />}
  />;
}

function LibraryHeader({ authorName }: { authorName?: string }) {
  const palette = getPalette(useApp().readingTheme);
  return <View style={styles.header}>
    <View style={styles.headerCopy}>
      <Urdu style={styles.heading}>Library</Urdu>
      <Urdu style={[styles.byline, { color: palette.muted }]}>{authorName || 'Private poetry collection'}</Urdu>
    </View>
    <View style={[styles.headerMark, { borderColor: palette.border, backgroundColor: palette.surface }]}><Ionicons name="library-outline" size={20} color={palette.accent} /></View>
  </View>;
}

function Search({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const palette = getPalette(useApp().readingTheme);
  return <View style={[styles.search, { backgroundColor: palette.input, borderColor: palette.border }]}>
    <Ionicons name="search-outline" size={19} color={palette.muted} />
    <TextInput value={value} onChangeText={onChange} selectionColor={palette.accent} placeholder="Search books and poems" placeholderTextColor={palette.muted} style={[styles.searchInput, { color: palette.text }]} />
    {value ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10} android_ripple={{ color: palette.border, borderless: true }} onPress={() => onChange('')}><Ionicons name="close-circle" size={19} color={palette.muted} /></Pressable> : null}
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: 112 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  headerCopy: { flex: 1, alignItems: 'flex-start', paddingRight: spacing.md },
  heading: { fontSize: typography.urdu.title.fontSize, lineHeight: typography.urdu.title.lineHeight, fontWeight: '700' },
  byline: { fontSize: typography.urdu.small.fontSize, lineHeight: typography.urdu.small.lineHeight, marginTop: -6 },
  headerMark: { width: 44, height: 44, borderRadius: radii.control, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  search: { minHeight: 50, borderWidth: 1, borderRadius: radii.control, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md },
  searchInput: { flex: 1, minHeight: 48, textAlign: 'left', writingDirection: 'ltr', fontSize: typography.latin.body.fontSize, lineHeight: typography.latin.body.lineHeight, paddingVertical: spacing.xs },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  filter: { minHeight: 38, paddingHorizontal: spacing.md, borderRadius: radii.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  filterText: { fontSize: typography.latin.small.fontSize, fontWeight: '700' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xl, marginBottom: spacing.lg },
  sectionTitle: { fontSize: typography.urdu.section.fontSize, lineHeight: typography.urdu.section.lineHeight, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  bookCell: { marginBottom: spacing.xl },
  bookPress: { width: '100%' },
  coverWrap: { width: '100%', position: 'relative', paddingRight: 4 },
  bookMeta: { marginTop: spacing.md, alignItems: 'center' },
  bookTitle: { width: '100%', minHeight: 40, textAlign: 'center', fontSize: typography.urdu.body.fontSize, lineHeight: typography.urdu.body.lineHeight, fontWeight: '700' },
  statusWrap: { marginTop: spacing.sm },
  edit: { position: 'absolute', left: 7, top: 7, width: 40, height: 40, borderWidth: 1, borderRadius: radii.control, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  pressed: { opacity: .72, transform: [{ scale: .985 }] },
  searchHeading: { alignItems: 'flex-start', marginTop: spacing.xl, marginBottom: spacing.md },
  searchQuery: { fontSize: typography.urdu.section.fontSize, lineHeight: typography.urdu.section.lineHeight, fontWeight: '700' },
  resultRow: { minHeight: 104, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: spacing.md },
  resultCover: { width: 78 },
  resultCopy: { flex: 1, alignItems: 'flex-start', gap: spacing.xxs },
  resultTitle: { fontSize: typography.urdu.body.fontSize, lineHeight: typography.urdu.body.lineHeight, fontWeight: '700' },
  resultBook: { fontSize: typography.urdu.small.fontSize, lineHeight: typography.urdu.small.lineHeight },
  poemIcon: { width: 58, height: 58, borderRadius: radii.card, alignItems: 'center', justifyContent: 'center' }
});
