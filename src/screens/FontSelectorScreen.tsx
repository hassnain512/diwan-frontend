import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../store/AppContext';
import { Button, Label, ScreenHeader, Urdu } from '../components/Ui';
import { getPalette, layout, nastaliqWeights, radii, spacing, typography } from '../theme/theme';

export function FontSelectorScreen({ onClose }: { onClose?: () => void }) {
  const app = useApp();
  const palette = getPalette(app.readingTheme);

  useEffect(() => {
    if (app.fontId !== 'noto') void app.setFont('noto');
  }, [app.fontId, app.setFont]);

  return <ScrollView style={[styles.root, { backgroundColor: palette.bg }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <ScreenHeader title="Reading" subtitle="Appearance and type" onClose={onClose} />

    <View style={styles.section}>
      <View><Text style={[styles.sectionTitle, { color: palette.text }]}>Theme</Text><Label style={{ color: palette.muted }}>Choose the most comfortable page appearance.</Label></View>
      <View style={[styles.segment, { backgroundColor: palette.surface2, borderColor: palette.border }]}>
        {([['classic', 'Paper', 'sunny-outline'], ['dark', 'Dark', 'moon-outline']] as const).map(([value, label, icon]) => {
          const selected = app.readingTheme === value;
          return <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => app.setTheme(value)} style={({ pressed }) => [styles.segmentItem, selected && { backgroundColor: palette.surface, borderColor: palette.borderStrong }, pressed && styles.pressed]}><Ionicons name={icon} size={17} color={selected ? palette.accentStrong : palette.muted} /><Text style={[styles.segmentText, { color: selected ? palette.text : palette.muted }]}>{label}</Text></Pressable>;
        })}
      </View>
    </View>

    <View style={styles.section}>
      <View><Text style={[styles.sectionTitle, { color: palette.text }]}>Typeface</Text><Label style={{ color: palette.muted }}>Noto Nastaliq Urdu is bundled and available offline.</Label></View>
      <Pressable accessibilityRole="radio" accessibilityState={{ checked: true }} accessibilityLabel="Noto Nastaliq Urdu, selected" onPress={() => void app.setFont('noto')} style={({ pressed }) => [styles.fontOption, { borderColor: palette.border, backgroundColor: palette.surface }, pressed && styles.pressed]}>
        <View style={styles.optionHeader}><View style={[styles.check, { backgroundColor: palette.accentSoft }]}><Ionicons name="checkmark" size={18} color={palette.accentStrong} /></View><View style={styles.optionIdentity}><Text style={[styles.fontName, { color: palette.text }]}>Noto Nastaliq Urdu</Text><Text style={[styles.fontMeta, { color: palette.muted }]}>Selected · Offline</Text></View></View>
        <View style={[styles.samplePanel, { backgroundColor: palette.bg, borderColor: palette.border }]}><Urdu style={[styles.sample, { color: palette.text, fontFamily: nastaliqWeights.regular }]}>ہزاروں خواہشیں ایسی کہ ہر خواہش پہ دم نکلے</Urdu><Urdu style={[styles.sample, { color: palette.text, fontFamily: nastaliqWeights.regular }]}>بہت نکلے مرے ارمان لیکن پھر بھی کم نکلے</Urdu></View>
      </Pressable>
    </View>

    <View style={[styles.note, { borderColor: palette.border }]}><Ionicons name="information-circle-outline" size={18} color={palette.muted} /><Label style={[styles.noteText, { color: palette.muted }]}>Additional typefaces will only appear here when their actual font files are bundled with the app.</Label></View>
    {onClose ? <Button title="Done" onPress={onClose} /> : null}
  </ScrollView>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, content: { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center', flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: 40, gap: spacing.xl }, section: { gap: spacing.md }, sectionTitle: { fontSize: typography.latin.section.fontSize, lineHeight: typography.latin.section.lineHeight, fontWeight: '800' },
  segment: { flexDirection: 'row', padding: 4, gap: 4, borderWidth: 1, borderRadius: radii.control }, segmentItem: { flex: 1, minHeight: 46, borderRadius: radii.small, borderWidth: 1, borderColor: 'transparent', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, segmentText: { fontSize: 13, fontWeight: '700' },
  fontOption: { borderWidth: 1, borderRadius: radii.card, padding: spacing.lg, gap: spacing.lg }, optionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, check: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, optionIdentity: { flex: 1, alignItems: 'flex-start' }, fontName: { fontSize: 16, fontWeight: '800' }, fontMeta: { fontSize: 11, marginTop: 3 }, samplePanel: { borderWidth: 1, borderRadius: radii.control, paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.lg, gap: 1 }, sample: { width: '100%', fontSize: 17, lineHeight: 38, textAlign: 'center' },
  note: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.lg, flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }, noteText: { flex: 1, lineHeight: 18 }, pressed: { opacity: .8, transform: [{ scale: .99 }] }
});
