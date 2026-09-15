import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BookStatus, WritingStatus } from '../types';
import { useApp } from '../store/AppContext';
import { getPalette, nastaliqWeights } from '../theme/theme';

export function StatusChip({ status }: { status: BookStatus | WritingStatus }) {
  const palette = getPalette(useApp().readingTheme);
  const config = status === 'published'
    ? { label: 'Published', background: palette.successBg, foreground: palette.success, border: palette.success }
    : status === 'coming_soon'
      ? { label: 'Coming soon', background: palette.warningBg, foreground: palette.warning, border: palette.warning }
      : { label: 'Draft', background: palette.surface2, foreground: palette.muted, border: palette.borderStrong };

  return <View style={[styles.chip, { backgroundColor: config.background, borderColor: config.border }]}>
    <View style={[styles.dot, { backgroundColor: config.foreground }]} />
    <Text style={[styles.text, { color: config.foreground }]}>{config.label}</Text>
  </View>;
}

const styles = StyleSheet.create({
  chip: { minHeight: 28, paddingHorizontal: 10, paddingVertical: 1, borderRadius: 999, borderWidth: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6 },
  dot: { width: 5, height: 5, borderRadius: 3, opacity: .84 },
  text: { fontSize: 10, lineHeight: 16, fontWeight: '600' }
});
