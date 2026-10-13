import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Book, Writing } from '../types';
import { useApp } from '../store/AppContext';
import { BookCover } from '../components/BookCover';
import { useDialog } from '../components/Dialog';
import { StatusChip } from '../components/StatusChip';
import { Button, EmptyState, IconButton, Label, Urdu } from '../components/Ui';
import { getPalette, layout, radii, spacing, typography } from '../theme/theme';

export function BookDetailScreen({ book, onBack, onOpenWriting, onEditWriting, onAddWriting, onPdf }: { book: Book; onBack: () => void; onOpenWriting: (writing: Writing) => void; onEditWriting: (writing: Writing) => void; onAddWriting: () => void; onPdf: () => void }) {
  const app = useApp();
  const dialog = useDialog();
  const palette = getPalette(app.readingTheme);
  const isAdmin = app.session?.role === 'admin';
  const writings = useMemo(() => app.writings
    .filter(writing => writing.bookId === book.id)
    .filter(writing => isAdmin || writing.status === 'published')
    .sort((a, b) => a.orderIndex - b.orderIndex), [app.writings, book.id, isAdmin]);
  const [reorder, setReorder] = useState(false);

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= writings.length) return;
    const ids = writings.map(writing => writing.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    await app.reorderWritings(book.id, ids);
  };

  const remove = async (writing: Writing) => {
    const confirmed = await dialog.confirm({ title: 'Delete poem?', message: `“${writing.title}” will be permanently deleted.`, confirmLabel: 'Delete', destructive: true, tone: 'danger', icon: 'trash-outline', requiredText: writing.title });
    if (confirmed) await app.removeWriting(writing.id);
  };

  const moveToBook = async (writing: Writing) => {
    const destinations = app.books
      .filter(candidate => candidate.id !== book.id)
      .sort((first, second) => first.orderIndex - second.orderIndex);
    if (!destinations.length) {
      await dialog.alert({ title: 'No other collection', message: 'Create another collection before moving this poem.', tone: 'info', icon: 'book-outline' });
      return;
    }
    const destinationId = await dialog.choose({
      title: 'Move poem',
      message: `Choose the collection for “${writing.title}”. The poem will be removed from “${book.title}”.`,
      tone: 'info',
      icon: 'arrow-forward-circle-outline',
      dismissible: true,
      choices: destinations.map(destination => ({ id: destination.id, label: destination.title, icon: 'book-outline' }))
    });
    if (!destinationId) return;
    const destination = destinations.find(candidate => candidate.id === destinationId);
    try {
      await app.moveWriting(writing.id, destinationId);
      await dialog.alert({ title: 'Poem moved', message: `“${writing.title}” is now in “${destination?.title || 'the selected collection'}”.`, tone: 'success', icon: 'checkmark-circle-outline' });
    } catch (error: any) {
      await dialog.alert({ title: 'Unable to move poem', message: error?.message || 'Please try again.', tone: 'danger' });
    }
  };

  return <View style={[styles.root, { backgroundColor: palette.bg }]}>
    <View style={[styles.topbar, { backgroundColor: palette.bg, borderBottomColor: palette.border }]}>
      <Pressable accessibilityLabel="Back to library" onPress={onBack} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
        <Ionicons name="chevron-back" size={22} color={palette.accent} />
        <Label style={{ color: palette.accentStrong }}>Library</Label>
      </Pressable>
      <View style={styles.headerActions}>
        {isAdmin ? <>
          <IconButton name="print-outline" label="Create PDF" onPress={onPdf} />
          <IconButton name={reorder ? 'checkmark' : 'swap-vertical-outline'} label={reorder ? 'Finish reordering' : 'Reorder poems'} onPress={() => setReorder(value => !value)} />
        </> : null}
      </View>
    </View>

    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={writings}
      keyExtractor={writing => writing.id}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={<>
        <View style={styles.hero}>
          <View style={styles.cover}><BookCover book={book} authorName={app.author?.authorNameUrdu} /></View>
          <View style={styles.bookCopy}>
            {isAdmin ? <StatusChip status={book.status} /> : null}
            <Urdu style={styles.bookTitle}>{book.title}</Urdu>
            <Urdu style={[styles.author, { color: palette.muted }]}>{app.author?.authorNameUrdu || app.author?.authorName}</Urdu>
            <Label style={[styles.count, { color: palette.muted }]}>{writings.length} {writings.length === 1 ? 'poem' : 'poems'}</Label>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: palette.border }]} />

        <View style={styles.sectionHead}>
          <View>
            <Urdu style={styles.sectionTitle}>Poems</Urdu>
            <Label style={{ color: palette.muted }}>Table of contents</Label>
          </View>
          {isAdmin ? <Button compact title="New poem" icon="add" onPress={onAddWriting} /> : null}
        </View>

        {reorder ? <View style={[styles.reorderHint, { backgroundColor: palette.warningBg }]}>
          <Ionicons name="swap-vertical-outline" size={18} color={palette.warning} />
          <Label style={[styles.reorderText, { color: palette.warning }]}>Use the arrows to change poem order, then tap the checkmark.</Label>
        </View> : null}
      </>}
      ListEmptyComponent={<EmptyState icon="document-text-outline" title="No poems yet" message={isAdmin ? 'Add the first poem to this collection.' : 'No published poems are available in this collection yet.'} action={isAdmin ? <Button title="Add poem" icon="add" onPress={onAddWriting} /> : undefined} />}
      renderItem={({ item, index }) => <Pressable disabled={reorder} onPress={() => onOpenWriting(item)} style={({ pressed }) => [styles.poemRow, { borderBottomColor: palette.border }, pressed && !reorder && styles.pressed]}>
        <Label style={[styles.number, { color: palette.muted }]}>{String(index + 1).padStart(2, '0')}</Label>
        <View style={styles.poemCopy}>
          <View style={styles.titleLine}>
            <Urdu numberOfLines={2} style={styles.poemTitle}>{item.title}</Urdu>
            {isAdmin && item.status === 'draft' ? <StatusChip status="draft" /> : null}
          </View>
        </View>
        {reorder ? <View style={styles.rowActions}>
          <IconButton name="arrow-up" label="Move up" onPress={() => move(index, -1)} />
          <IconButton name="arrow-down" label="Move down" onPress={() => move(index, 1)} />
        </View> : isAdmin ? <View style={styles.rowActions}>
          <IconButton name="arrow-forward-circle-outline" label="Move poem" onPress={() => void moveToBook(item)} />
          <IconButton name="create-outline" label="Edit poem" onPress={() => onEditWriting(item)} />
          <IconButton name="trash-outline" label="Delete poem" danger onPress={() => void remove(item)} />
        </View> : <Ionicons name="chevron-forward" size={18} color={palette.muted} />}
      </Pressable>}
    />
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topbar: { minHeight: 62, paddingHorizontal: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingRight: spacing.sm },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  list: { flex: 1 },
  content: { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  hero: { alignItems: 'center', paddingTop: spacing.xl },
  cover: { width: 148, marginBottom: spacing.lg },
  bookCopy: { alignItems: 'center', maxWidth: 520 },
  bookTitle: { textAlign: 'center', fontSize: typography.urdu.title.fontSize, lineHeight: typography.urdu.title.lineHeight, fontWeight: '700', marginTop: spacing.sm },
  author: { textAlign: 'center', fontSize: typography.urdu.small.fontSize, lineHeight: typography.urdu.small.lineHeight, marginTop: -4 },
  count: { marginTop: spacing.xs },
  divider: { width: '100%', height: StyleSheet.hairlineWidth, marginVertical: spacing.xl },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionTitle: { fontSize: typography.urdu.section.fontSize, lineHeight: typography.urdu.section.lineHeight, fontWeight: '700' },
  reorderHint: { borderRadius: radii.control, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reorderText: { flex: 1 },
  poemRow: { minHeight: 76, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  number: { width: 28, textAlign: 'center', fontVariant: ['tabular-nums'] },
  poemCopy: { flex: 1, minWidth: 0 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  poemTitle: { flex: 1, fontSize: typography.urdu.body.fontSize, lineHeight: typography.urdu.body.lineHeight, fontWeight: '700' },
  rowActions: { flexDirection: 'row', gap: spacing.xs },
  pressed: { opacity: .62 }
});
