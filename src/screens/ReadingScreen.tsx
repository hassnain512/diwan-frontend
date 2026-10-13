import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenCapture from 'expo-screen-capture';
import { Book, Writing } from '../types';
import { useApp } from '../store/AppContext';
import { PoetryHtml } from '../components/PoetryHtml';
import { Label, Urdu } from '../components/Ui';
import { fontFamilies, getPalette, layout, radii, spacing, typography } from '../theme/theme';

function ReaderProtection() {
  ScreenCapture.usePreventScreenCapture('raza-poetry-reader');
  return null;
}

export function ReadingScreen({ book, writing, onBack, onSelectWriting, onFont }: { book: Book; writing: Writing; onBack: () => void; onSelectWriting: (writing: Writing) => void; onFont: () => void }) {
  const app = useApp();
  const palette = getPalette(app.readingTheme);
  const isAdmin = app.session?.role === 'admin';
  const all = useMemo(() => app.writings
    .filter(item => item.bookId === book.id && (isAdmin || item.status === 'published'))
    .sort((a, b) => a.orderIndex - b.orderIndex), [app.writings, book.id, isAdmin]);
  const index = all.findIndex(item => item.id === writing.id);
  const previous = index > 0 ? all[index - 1] : undefined;
  const next = index >= 0 && index < all.length - 1 ? all[index + 1] : undefined;

  return <View style={[styles.root, { backgroundColor: palette.bg }]}>
    {!isAdmin ? <ReaderProtection /> : null}

    <View style={[styles.header, { backgroundColor: palette.bg, borderBottomColor: palette.border }]}>
      <Pressable accessibilityLabel="Back to book" onPress={onBack} style={({ pressed }) => [styles.headerBack, pressed && styles.pressed]}>
        <Ionicons name="chevron-back" size={22} color={palette.accent} />
        <Urdu numberOfLines={1} style={styles.bookName}>{book.title}</Urdu>
      </Pressable>
      <View style={styles.controls}>
        <Pressable accessibilityLabel="Reading settings" onPress={onFont} style={({ pressed }) => [styles.controlButton, { borderColor: palette.border, backgroundColor: palette.surface }, pressed && styles.pressed]}>
          <Text style={[styles.aa, { color: palette.accentStrong }]}>Aa</Text>
        </Pressable>
        <Pressable accessibilityLabel="Change reading theme" onPress={() => app.setTheme(palette.dark ? 'classic' : 'dark')} style={({ pressed }) => [styles.controlButton, { borderColor: palette.border, backgroundColor: palette.surface }, pressed && styles.pressed]}>
          <Ionicons name={palette.dark ? 'sunny-outline' : 'moon-outline'} size={18} color={palette.accentStrong} />
        </Pressable>
      </View>
    </View>

    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.paper, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
        {!isAdmin ? <Text style={[styles.watermark, { color: palette.muted }]}>{app.session?.username || 'reader'} · RAZA</Text> : null}
        <Urdu style={styles.title}>{writing.title}</Urdu>
        <Urdu style={[styles.author, { color: palette.muted }]}>{app.author?.authorNameUrdu || app.author?.authorName}</Urdu>
        <View style={[styles.titleRule, { backgroundColor: palette.border }]} />

        <View style={styles.poetry}>
          <PoetryHtml html={writing.content} color={palette.text} selectable={isAdmin} fontSize={typography.urdu.poetry.fontSize} lineHeight={typography.urdu.poetry.lineHeight} fontFamily={fontFamilies[app.fontId]} />
        </View>

        <View style={[styles.endRule, { backgroundColor: palette.border }]} />
        <Label style={[styles.page, { color: palette.muted }]}>{index + 1} of {all.length}</Label>
      </View>
    </ScrollView>

    {(previous || next) ? <View style={[styles.footer, { backgroundColor: palette.bg, borderTopColor: palette.border }]}>
      {previous ? <Pressable onPress={() => onSelectWriting(previous)} style={({ pressed }) => [styles.nav, pressed && styles.pressed]}>
        <Ionicons name="chevron-back" size={16} color={palette.accent} />
        <View style={styles.navCopyLeft}><Label style={{ color: palette.muted }}>Previous</Label><Urdu numberOfLines={1} style={styles.navTitle}>{previous.title}</Urdu></View>
      </Pressable> : <View style={styles.navSpacer} />}
      {next ? <Pressable onPress={() => onSelectWriting(next)} style={({ pressed }) => [styles.nav, pressed && styles.pressed]}>
        <View style={styles.navCopyRight}><Label style={{ color: palette.muted }}>Next</Label><Urdu numberOfLines={1} style={styles.navTitle}>{next.title}</Urdu></View>
        <Ionicons name="chevron-forward" size={16} color={palette.accent} />
      </Pressable> : <View style={styles.navSpacer} />}
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { minHeight: 62, paddingHorizontal: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBack: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginRight: spacing.sm },
  bookName: { flexShrink: 1, fontSize: typography.urdu.small.fontSize, lineHeight: typography.urdu.small.lineHeight, fontWeight: '700' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  controlButton: { width: 44, height: 44, borderRadius: radii.control, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  aa: { fontSize: 15, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  paper: { width: '100%', maxWidth: layout.readerMaxWidth, alignSelf: 'center', minHeight: 620, borderWidth: 1, borderRadius: radii.card, paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.xxl, alignItems: 'center' },
  watermark: { opacity: .14, fontSize: 8, letterSpacing: 1.8, marginBottom: spacing.md },
  title: { fontSize: typography.urdu.title.fontSize + 2, lineHeight: typography.urdu.title.lineHeight + 4, fontWeight: '700', textAlign: 'center' },
  author: { fontSize: typography.urdu.small.fontSize, lineHeight: typography.urdu.small.lineHeight, textAlign: 'center', marginTop: -2 },
  titleRule: { width: 56, height: 1, marginTop: spacing.lg, marginBottom: spacing.xl },
  poetry: { width: '100%' },
  endRule: { width: 56, height: 1, marginTop: spacing.xxl, marginBottom: spacing.md },
  page: { textAlign: 'center' },
  footer: { minHeight: 70, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.sm },
  nav: { flex: 1, minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm },
  navSpacer: { flex: 1 },
  navCopyLeft: { flex: 1, alignItems: 'flex-start' },
  navCopyRight: { flex: 1, alignItems: 'flex-end' },
  navTitle: { maxWidth: '100%', fontSize: typography.urdu.small.fontSize, lineHeight: typography.urdu.small.lineHeight, fontWeight: '700' },
  pressed: { opacity: .62 }
});
