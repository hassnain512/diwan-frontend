import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../store/AppContext';
import { Button, Card, Urdu } from '../components/Ui';
import { getPalette, nastaliqWeights } from '../theme/theme';

export function FontSelectorScreen({ onClose }: { onClose: () => void }) {
  const app = useApp();
  const palette = getPalette(app.readingTheme);

  useEffect(() => {
    if (app.fontId !== 'noto') void app.setFont('noto');
  }, [app.fontId, app.setFont]);

  return <ScrollView
    style={[styles.root, { backgroundColor: palette.bg }]}
    contentContainerStyle={styles.content}
    showsVerticalScrollIndicator={false}
  >
    <View style={[styles.header, { borderBottomColor: palette.border }]}>
      <Button compact variant="ghost" title="Close" onPress={onClose} />
      <Text style={[styles.heading, { color: palette.text }]}>Reading Font</Text>
      <View style={styles.headerBalance} />
    </View>

    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: true }}
      accessibilityLabel="Noto Nastaliq Urdu, selected"
      onPress={() => void app.setFont('noto')}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Card style={[styles.fontCard, { backgroundColor: palette.elevated, borderColor: palette.gold, shadowColor: palette.shadow }]}>
        <View style={styles.optionHeader}>
          <View style={[styles.selectedMark, { backgroundColor: palette.accent }]}>
            <Ionicons name="checkmark" size={17} color={palette.dark ? palette.bg : palette.surface} />
          </View>
          <View style={styles.optionIdentity}>
            <Text style={[styles.fontName, { color: palette.text }]}>Noto Nastaliq Urdu</Text>
            <Text style={[styles.fontMeta, { color: palette.muted }]}>Selected · Available offline</Text>
          </View>
        </View>

        <View style={[styles.samplePanel, { backgroundColor: palette.bg, borderColor: palette.border }]}>
          <View style={styles.sampleRuleRow}>
            <View style={[styles.sampleRule, { backgroundColor: palette.gold }]} />
            <Text style={[styles.flourish, { color: palette.gold }]}>❦</Text>
            <View style={[styles.sampleRule, { backgroundColor: palette.gold }]} />
          </View>
          <Urdu style={[styles.sample, { color: palette.text, fontFamily: nastaliqWeights.regular }]}>ہزاروں خواہشیں ایسی کہ ہر خواہش پہ دم نکلے</Urdu>
          <Urdu style={[styles.sample, { color: palette.text, fontFamily: nastaliqWeights.regular }]}>بہت نکلے مرے ارمان لیکن پھر بھی کم نکلے</Urdu>
        </View>
      </Card>
    </Pressable>
  </ScrollView>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', flexGrow: 1, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 36 },
  header: { minHeight: 54, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 22 },
  headerBalance: { width: 72 },
  heading: { fontSize: 19, fontWeight: '800', textAlign: 'center' },
  pressed: { opacity: .82, transform: [{ scale: .992 }] },
  fontCard: { padding: 16, borderWidth: 1.5, borderRadius: 23, shadowOffset: { width: 0, height: 12 }, shadowOpacity: .12, shadowRadius: 24, elevation: 4 },
  optionHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  selectedMark: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  optionIdentity: { flex: 1, alignItems: 'flex-start' },
  fontName: { fontSize: 17, fontWeight: '800' },
  fontMeta: { fontSize: 11, marginTop: 3 },
  samplePanel: { borderWidth: 1, borderRadius: 17, paddingHorizontal: 14, paddingTop: 13, paddingBottom: 18, marginTop: 17, alignItems: 'center' },
  sampleRuleRow: { width: '64%', flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  sampleRule: { flex: 1, height: .7, opacity: .5 },
  flourish: { fontSize: 13, opacity: .8 },
  sample: { width: '100%', fontSize: 17, lineHeight: 38, textAlign: 'center' }
});

