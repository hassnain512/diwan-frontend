import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Book, Writing } from '../types';
import { useApp } from '../store/AppContext';
import { BookCover } from '../components/BookCover';
import { StatusChip } from '../components/StatusChip';
import { Button, Card, IconButton, Urdu } from '../components/Ui';
import { getPalette } from '../theme/theme';

export function BookDetailScreen({ book, onBack, onOpenWriting, onEditWriting, onAddWriting, onPdf }: { book: Book; onBack: () => void; onOpenWriting: (writing: Writing) => void; onEditWriting: (writing: Writing) => void; onAddWriting: () => void; onPdf: () => void }) {
  const app = useApp();
  const palette = getPalette(app.readingTheme);
  const isAdmin = app.session?.role === 'admin';
  const writings = useMemo(() => app.writings
    .filter(w => w.bookId === book.id)
    .filter(w => isAdmin || w.status === 'published')
    .sort((a, b) => a.orderIndex - b.orderIndex), [app.writings, book.id, isAdmin]);
  const [reorder, setReorder] = useState(false);

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= writings.length) return;
    const ids = writings.map(w => w.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    await app.reorderWritings(book.id, ids);
  };
  const remove = (writing: Writing) => Alert.alert('Delete poem?', `“${writing.title}” will be permanently deleted.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => app.removeWriting(writing.id) }
  ]);

  return <View style={[styles.root, { backgroundColor: palette.bg }]}>
    <View style={[styles.topbar, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <Pressable accessibilityLabel="Back" onPress={onBack} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
        <Ionicons name="chevron-back" size={21} color={palette.accent} />
        <Urdu style={styles.backText}>Library</Urdu>
      </Pressable>
      {isAdmin ? <View style={styles.headerActions}>
        <IconButton name="print-outline" label="PDF" onPress={onPdf} />
        <IconButton name={reorder ? 'checkmark' : 'swap-vertical-outline'} label="Reorder" onPress={() => setReorder(value => !value)} />
      </View> : <View style={[styles.miniSeal, { backgroundColor: palette.accentSoft }]}><Ionicons name="book-outline" size={17} color={palette.accent} /></View>}
    </View>

    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={writings}
      keyExtractor={writing => writing.id}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={<>
        <View style={styles.hero}>
          <View style={[styles.halo, { backgroundColor: palette.accentSoft }]} />
          <View style={[styles.cover, { shadowColor: palette.shadow }]}><BookCover book={book} authorName={app.author?.authorNameUrdu} /></View>
          <View style={[styles.collectionPill, { backgroundColor: palette.surface, borderColor: palette.border }]}><Ionicons name="library-outline" size={12} color={palette.gold} /><Urdu style={[styles.collectionPillText, { color: palette.muted }]}>{writings.length} poems</Urdu></View>
          <View style={styles.titleBlock}>
            <StatusChip status={book.status} />
            <Urdu style={styles.bookTitle}>{book.title}</Urdu>
            <Urdu style={[styles.author, { color: palette.muted }]}>By {app.author?.authorName}</Urdu>
          </View>
          <View style={styles.ornamentRow}><View style={[styles.rule, { backgroundColor: palette.border }]} /><Urdu style={[styles.ornament, { color: palette.gold }]}>❦</Urdu><View style={[styles.rule, { backgroundColor: palette.border }]} /></View>
        </View>

        <View style={styles.sectionHead}>
          <View style={styles.sectionTitleWrap}><Urdu style={styles.sectionTitle}>Poems</Urdu></View>
          {isAdmin ? <Button compact title="New poem" icon="add" onPress={onAddWriting} /> : <Urdu style={[styles.total, { color: palette.muted }]}>{writings.length} total</Urdu>}
        </View>
        {reorder ? <Card style={[styles.reorderHint, { backgroundColor: palette.warningBg, borderColor: palette.warningBg }]}><Ionicons name="swap-vertical-outline" size={18} color={palette.warning} /><Urdu style={[styles.reorderText, { color: palette.warning }]}>Use the arrows to reorder.</Urdu></Card> : null}
      </>}
      ListEmptyComponent={<Card style={styles.emptyCard}><View style={[styles.emptyIcon, { backgroundColor: palette.accentSoft }]}><Ionicons name="document-text-outline" size={27} color={palette.accent} /></View><Urdu style={[styles.empty, { color: palette.muted }]}>No poems yet</Urdu>{isAdmin ? <Button title="Add poem" icon="add" onPress={onAddWriting} /> : null}</Card>}
      renderItem={({ item, index }) => <Pressable disabled={reorder} onPress={() => onOpenWriting(item)} style={({ pressed }) => [styles.writingCard, { backgroundColor: palette.surface, borderColor: palette.border, shadowColor: palette.shadow }, pressed && !reorder && styles.pressed]}>
        <View style={[styles.number, { backgroundColor: palette.accentSoft, borderColor: palette.border }]}><Urdu style={[styles.numberText, { color: palette.accent }]}>{index + 1}</Urdu></View>
        <View style={styles.writingBody}>
          <View style={styles.titleLine}><Urdu numberOfLines={1} style={styles.writingTitle}>{item.title}</Urdu>{item.status === 'draft' ? <StatusChip status="draft" /> : null}</View>
          <Urdu style={[styles.tap, { color: palette.muted }]}>{reorder ? 'Reorder' : 'Read poem'}</Urdu>
        </View>
        {reorder ? <View style={styles.orderButtons}><IconButton name="arrow-up" onPress={() => move(index, -1)} /><IconButton name="arrow-down" onPress={() => move(index, 1)} /></View>
          : isAdmin ? <View style={styles.adminButtons}><IconButton name="create-outline" label="Edit" onPress={() => onEditWriting(item)} /><IconButton name="trash-outline" label="Delete" danger onPress={() => remove(item)} /></View>
          : <View style={[styles.readPill, { backgroundColor: palette.accentSoft }]}><Urdu style={[styles.readText, { color: palette.accent }]}>Read</Urdu><Ionicons name="chevron-forward" size={13} color={palette.accent} /></View>}
      </Pressable>}
    />
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topbar: { minHeight: 58, paddingHorizontal: 14, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 4 },
  backText: { fontSize: 12, lineHeight: 24, fontWeight: '600' },
  headerActions: { flexDirection: 'row', gap: 7 },
  miniSeal: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 16, paddingBottom: 34 },
  hero: { alignItems: 'center', paddingTop: 24, overflow: 'hidden' },
  halo: { position: 'absolute', top: 48, width: 220, height: 220, borderRadius: 110, opacity: .55 },
  cover: { width: 142, marginBottom: 9, shadowOffset: { width: 0, height: 14 }, shadowOpacity: .22, shadowRadius: 18, elevation: 8 },
  collectionPill: { minHeight: 31, borderWidth: 1, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 2, marginTop: 1 },
  collectionPillText: { fontSize: 9, lineHeight: 19 },
  titleBlock: { alignItems: 'center', gap: 3, marginTop: 9 },
  bookTitle: { textAlign: 'center', fontSize: 26, lineHeight: 43, fontWeight: '700' },
  author: { textAlign: 'center', fontSize: 11, lineHeight: 22, marginTop: -5 },
  metaRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, marginTop: 2 },
  date: { fontSize: 8, lineHeight: 18 },
  ornamentRow: { width: '72%', flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 13, marginBottom: 17 },
  rule: { flex: 1, height: 1 },
  ornament: { fontSize: 16, lineHeight: 25 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 },
  sectionTitleWrap: { alignItems: 'flex-start', flex: 1 },
  sectionTitle: { fontSize: 20, lineHeight: 35, fontWeight: '700' },
  sectionSub: { fontSize: 9, lineHeight: 19, marginTop: -5 },
  total: { fontSize: 10, lineHeight: 21 },
  reorderHint: { padding: 11, marginBottom: 10, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 8 },
  reorderText: { flex: 1, fontSize: 10, lineHeight: 21 },
  writingCard: { minHeight: 82, borderWidth: 1, borderRadius: 18, paddingHorizontal: 11, paddingVertical: 9, marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 10, shadowOffset: { width: 0, height: 5 }, shadowOpacity: .035, shadowRadius: 10, elevation: 1 },
  number: { width: 38, height: 38, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  numberText: { fontSize: 13, lineHeight: 25, fontWeight: '700' },
  writingBody: { flex: 1, alignItems: 'flex-start' },
  titleLine: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 6 },
  writingTitle: { flex: 1, fontSize: 16, lineHeight: 30, fontWeight: '700' },
  tap: { fontSize: 9, lineHeight: 19, marginTop: -3 },
  readPill: { minHeight: 30, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 9 },
  readText: { fontSize: 9, lineHeight: 19, fontWeight: '600' },
  adminButtons: { flexDirection: 'row', gap: 5 },
  orderButtons: { flexDirection: 'row', gap: 5 },
  emptyCard: { alignItems: 'center', gap: 10, marginTop: 3 },
  emptyIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', fontSize: 11, lineHeight: 23, paddingVertical: 3 },
  pressed: { opacity: .72, transform: [{ scale: .99 }] }
});

