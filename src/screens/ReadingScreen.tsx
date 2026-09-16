import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenCapture from 'expo-screen-capture';
import { Book, Writing } from '../types';
import { useApp } from '../store/AppContext';
import { PoetryHtml } from '../components/PoetryHtml';
import { Urdu } from '../components/Ui';
import { fontFamilies, getPalette } from '../theme/theme';

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
  const fontLabel = 'Nastaliq';

  return <View style={[styles.root, { backgroundColor: palette.bg }]}>
    {!isAdmin ? <ReaderProtection /> : null}
    <View style={[styles.header, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <Pressable accessibilityLabel="Back to book" onPress={onBack} style={({ pressed }) => [styles.headerBack, pressed && styles.pressed]}>
        <Ionicons name="chevron-back" size={21} color={palette.accent} />
        <Urdu numberOfLines={1} style={styles.bookName}>{book.title}</Urdu>
      </Pressable>
      <View style={styles.controls}>
        <Pressable accessibilityLabel="Reading font" onPress={onFont} style={({ pressed }) => [styles.fontButton, { backgroundColor: palette.accentSoft, borderColor: palette.border }, pressed && styles.pressed]}>
          <Ionicons name="text-outline" size={15} color={palette.accent} />
          <Urdu style={[styles.fontLabel, { color: palette.accent }]}>{fontLabel}</Urdu>
        </Pressable>
        <Pressable accessibilityLabel="Change theme" onPress={() => app.setTheme(palette.dark ? 'classic' : 'dark')} style={({ pressed }) => [styles.icon, { backgroundColor: palette.surface, borderColor: palette.border }, pressed && styles.pressed]}>
          <Ionicons name={palette.dark ? 'sunny-outline' : 'moon-outline'} size={18} color={palette.accent} />
        </Pressable>
      </View>
    </View>

    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.paper, { backgroundColor: palette.elevated, borderColor: palette.border, shadowColor: palette.shadow }]}>
        <View style={[styles.corner, styles.cornerTR, { borderColor: palette.gold }]} />
        <View style={[styles.corner, styles.cornerTL, { borderColor: palette.gold }]} />
        <View style={[styles.corner, styles.cornerBR, { borderColor: palette.gold }]} />
        <View style={[styles.corner, styles.cornerBL, { borderColor: palette.gold }]} />

        {!isAdmin ? <Text style={[styles.watermark, { color: palette.muted }]}>{app.session?.username || 'reader'}  •  RAZA  •  {app.session?.username || 'reader'}</Text> : <View style={{ height: 8 }} />}
        <Urdu style={[styles.topOrnament, { color: palette.gold }]}>❦  ✦  ❦</Urdu>
        <Urdu style={[styles.title, { color: palette.accentStrong }]}>{writing.title}</Urdu>
        <Urdu style={[styles.author, { color: palette.muted }]}>{app.author?.authorName}</Urdu>
        <View style={styles.ruleRow}><View style={[styles.rule, { backgroundColor: palette.border }]} /><View style={[styles.ruleDiamond, { borderColor: palette.gold }]} /><View style={[styles.rule, { backgroundColor: palette.border }]} /></View>

        <PoetryHtml html={writing.content} color={palette.text} selectable={isAdmin} fontSize={19} lineHeight={49} fontFamily={fontFamilies[app.fontId]} />

        <View style={styles.ruleRow}><View style={[styles.rule, { backgroundColor: palette.border }]} /><View style={[styles.ruleDiamond, { borderColor: palette.gold }]} /><View style={[styles.rule, { backgroundColor: palette.border }]} /></View>
        <Urdu style={[styles.page, { color: palette.muted }]}>{index + 1} / {all.length}</Urdu>
      </View>
    </ScrollView>

    {(previous || next) ? <View style={[styles.footer, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      {previous ? <Pressable onPress={() => onSelectWriting(previous)} style={({ pressed }) => [styles.nav, { backgroundColor: palette.elevated, borderColor: palette.border }, pressed && styles.pressed]}>
        <Ionicons name="chevron-back" size={16} color={palette.accent} />
        <View style={styles.nextText}><Urdu style={[styles.navHint, { color: palette.muted }]}>Previous</Urdu><Urdu numberOfLines={1} style={styles.navTitle}>{previous.title}</Urdu></View>
      </Pressable> : <View style={styles.navSpacer} />}
      {next ? <Pressable onPress={() => onSelectWriting(next)} style={({ pressed }) => [styles.nav, { backgroundColor: palette.elevated, borderColor: palette.border }, pressed && styles.pressed]}>
        <View style={styles.previousText}><Urdu style={[styles.navHint, { color: palette.muted }]}>Next</Urdu><Urdu numberOfLines={1} style={styles.navTitle}>{next.title}</Urdu></View>
        <Ionicons name="chevron-forward" size={16} color={palette.accent} />
      </Pressable> : <View style={styles.navSpacer} />}
    </View> : null}
  </View>;
}

const corner = { position: 'absolute' as const, width: 22, height: 22, opacity: .38 };
const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { minHeight: 64, paddingHorizontal: 11, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBack: { flex: 1, minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 8 },
  bookName: { flexShrink: 1, fontSize: 14, lineHeight: 27, fontWeight: '700' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fontButton: { minHeight: 36, maxWidth: 84, paddingHorizontal: 8, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
  fontLabel: { fontSize: 8, lineHeight: 18 },
  icon: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 12, paddingTop: 15, paddingBottom: 20 },
  paper: { width: '100%', maxWidth: 620, alignSelf: 'center', minHeight: 620, borderWidth: 1, borderRadius: 22, paddingHorizontal: 20, paddingTop: 23, paddingBottom: 28, alignItems: 'center', overflow: 'hidden', shadowOffset: { width: 0, height: 12 }, shadowOpacity: .08, shadowRadius: 24, elevation: 3 },
  corner: corner,
  cornerTR: { top: 12, right: 12, borderTopWidth: 1, borderRightWidth: 1, borderTopRightRadius: 7 },
  cornerTL: { top: 12, left: 12, borderTopWidth: 1, borderLeftWidth: 1, borderTopLeftRadius: 7 },
  cornerBR: { bottom: 12, right: 12, borderBottomWidth: 1, borderRightWidth: 1, borderBottomRightRadius: 7 },
  cornerBL: { bottom: 12, left: 12, borderBottomWidth: 1, borderLeftWidth: 1, borderBottomLeftRadius: 7 },
  watermark: { opacity: .13, fontSize: 8, letterSpacing: 2.1, marginBottom: 5 },
  topOrnament: { fontSize: 12, lineHeight: 24, opacity: .8 },
  kicker: { fontSize: 9, lineHeight: 20, marginTop: -2 },
  title: { fontSize: 27, lineHeight: 46, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  author: { fontSize: 10, lineHeight: 21, textAlign: 'center', marginTop: -5 },
  ruleRow: { width: '78%', flexDirection: 'row', alignItems: 'center', gap: 9, marginVertical: 21 },
  rule: { flex: 1, height: 1 },
  ruleDiamond: { width: 6, height: 6, borderWidth: 1, transform: [{ rotate: '45deg' }] },
  archive: { fontSize: 10, lineHeight: 22, fontWeight: '600' },
  page: { fontSize: 8, lineHeight: 18, marginTop: -4 },
  protection: { minHeight: 30, borderRadius: 999, marginTop: 9, paddingHorizontal: 11, flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  protected: { fontSize: 8, lineHeight: 18, textAlign: 'center' },
  footer: { minHeight: 72, paddingHorizontal: 7, paddingVertical: 7, borderTopWidth: 1, flexDirection: 'row', gap: 7 },
  nav: { flex: 1, minHeight: 56, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8 },
  navSpacer: { flex: 1 },
  nextText: { flex: 1, alignItems: 'flex-start' },
  previousText: { flex: 1, alignItems: 'flex-end' },
  navHint: { fontSize: 7, lineHeight: 16 },
  navTitle: { maxWidth: '100%', fontSize: 9, lineHeight: 20, fontWeight: '700' },
  pressed: { opacity: .66 }
});


