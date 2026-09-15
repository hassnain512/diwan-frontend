import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Book } from '../types';
import { nastaliqWeights } from '../theme/theme';

type CoverPalette = {
  bg: string;
  deep: string;
  spine: string;
  accent: string;
  text: string;
  pages: string;
  pageEdge: string;
};

const themes: Record<string, CoverPalette> = {
  'leather-gold': { bg: '#533426', deep: '#2C1712', spine: '#351C17', accent: '#C9A963', text: '#FFF4DC', pages: '#E8DDC7', pageEdge: '#B7A78B' },
  'maroon-gold': { bg: '#591D2A', deep: '#2A0C13', spine: '#3A101A', accent: '#D0AE5F', text: '#FFF2D6', pages: '#E9DDC6', pageEdge: '#B6A486' },
  'emerald-gilded': { bg: '#0E4735', deep: '#06251C', spine: '#083226', accent: '#CDB56B', text: '#F8F0D8', pages: '#E7DFC9', pageEdge: '#AA9D82' },
  'sapphire-silver': { bg: '#223850', deep: '#0E1B29', spine: '#152638', accent: '#BEC8D2', text: '#F6F8F7', pages: '#E1E2DE', pageEdge: '#A7A9A7' },
  'noir-cream': { bg: '#252321', deep: '#11100F', spine: '#171513', accent: '#D4C8AE', text: '#FBF3E4', pages: '#E8E0D2', pageEdge: '#AAA092' },
  'terracotta-copper': { bg: '#75402F', deep: '#371B13', spine: '#4B281E', accent: '#D29A6D', text: '#FFF0E3', pages: '#E8D9C6', pageEdge: '#B19C82' }
};

function CoverDepth({ palette }: { palette: CoverPalette }) {
  return <>
    <View style={[styles.pageBlock, { backgroundColor: palette.pages, borderColor: palette.pageEdge }]}>
      <View style={[styles.pageLine, styles.pageLineOne, { backgroundColor: palette.pageEdge }]} />
      <View style={[styles.pageLine, styles.pageLineTwo, { backgroundColor: palette.pageEdge }]} />
      <View style={[styles.pageLine, styles.pageLineThree, { backgroundColor: palette.pageEdge }]} />
    </View>
    <View style={[styles.spine, { backgroundColor: palette.spine, borderColor: palette.accent }]}>
      <View style={[styles.spineShine, { backgroundColor: palette.accent }]} />
      <View style={[styles.spineBand, styles.spineBandTop, { borderColor: palette.accent }]} />
      <View style={[styles.spineBand, styles.spineBandBottom, { borderColor: palette.accent }]} />
    </View>
  </>;
}

function LeatherTexture({ color }: { color: string }) {
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <View style={[styles.textureDot, styles.textureOne, { backgroundColor: color }]} />
    <View style={[styles.textureDot, styles.textureTwo, { backgroundColor: color }]} />
    <View style={[styles.textureDot, styles.textureThree, { backgroundColor: color }]} />
    <View style={[styles.textureDot, styles.textureFour, { backgroundColor: color }]} />
    <View style={[styles.textureDot, styles.textureFive, { backgroundColor: color }]} />
    <View style={[styles.textureDot, styles.textureSix, { backgroundColor: color }]} />
    <View style={[styles.sheen, { backgroundColor: color }]} />
  </View>;
}

function Corner({ position, color }: { position: 'tl' | 'tr' | 'bl' | 'br'; color: string }) {
  return <View style={[
    styles.corner,
    position === 'tl' && styles.cornerTL,
    position === 'tr' && styles.cornerTR,
    position === 'bl' && styles.cornerBL,
    position === 'br' && styles.cornerBR,
    { borderColor: color }
  ]} />;
}

export function BookCover({ book, authorName, compact = false }: { book: Book; authorName?: string; compact?: boolean }) {
  const palette = themes[book.coverTheme || 'leather-gold'] || themes['leather-gold'];
  const shellStyle = [styles.shell, compact && styles.compact, { shadowColor: palette.deep }];

  if (book.coverType === 'custom' && book.coverUrl) {
    return <View style={shellStyle}>
      <CoverDepth palette={palette} />
      <View style={[styles.front, { borderColor: palette.pageEdge, backgroundColor: palette.deep }]}>
        <Image source={{ uri: book.coverUrl }} style={styles.customImage} resizeMode="cover" />
        <View pointerEvents="none" style={styles.customGlaze} />
      </View>
    </View>;
  }

  const ornament = book.coverOrnament === 'geometric'
    ? '◇  ◇  ◇'
    : book.coverOrnament === 'floral'
      ? '❦  ❦'
      : book.coverOrnament === 'calligraphy'
        ? '۞'
        : '✦';

  return <View style={shellStyle}>
    <CoverDepth palette={palette} />
    <View style={[styles.front, { backgroundColor: palette.bg, borderColor: palette.accent }]}>
      <LeatherTexture color={palette.accent} />
      <View style={[styles.frameOuter, compact && styles.frameOuterCompact, { borderColor: palette.accent }]}>
        <Corner position="tl" color={palette.accent} />
        <Corner position="tr" color={palette.accent} />
        <Corner position="bl" color={palette.accent} />
        <Corner position="br" color={palette.accent} />
        <View style={[styles.frameInner, compact && styles.frameInnerCompact, { borderColor: palette.accent }]}>
          <View style={styles.kickerRow}>
            <View style={[styles.hairline, { backgroundColor: palette.accent }]} />
            <Text style={[styles.kicker, compact && styles.kickerCompact, { color: palette.accent }]}>POETRY COLLECTION</Text>
            <View style={[styles.hairline, { backgroundColor: palette.accent }]} />
          </View>
          <View style={styles.titleArea}>
            <Text style={[styles.title, compact && styles.titleCompact, { color: palette.text, fontFamily: nastaliqWeights.bold }]} numberOfLines={3}>{book.title}</Text>
            <View style={styles.ornamentRow}>
              <View style={[styles.titleRule, { backgroundColor: palette.accent }]} />
              <Text style={[styles.ornament, compact && styles.ornamentCompact, { color: palette.accent }]}>{ornament}</Text>
              <View style={[styles.titleRule, { backgroundColor: palette.accent }]} />
            </View>
          </View>
          <Text numberOfLines={1} style={[styles.author, compact && styles.authorCompact, { color: palette.text, fontFamily: nastaliqWeights.semibold }]}>{authorName || 'Hassnain Raza Maitla'}</Text>
        </View>
      </View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    aspectRatio: .68,
    position: 'relative',
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: .28,
    shadowRadius: 14,
    elevation: 10
  },
  compact: { width: 86, height: 126, aspectRatio: undefined },
  pageBlock: { position: 'absolute', top: 5, right: 0, bottom: 0, left: 6, borderWidth: 1, borderRadius: 11, overflow: 'hidden' },
  pageLine: { position: 'absolute', right: 1, width: 1, top: 9, bottom: 8, opacity: .42 },
  pageLineOne: { right: 2 },
  pageLineTwo: { right: 4, opacity: .25 },
  pageLineThree: { right: 6, opacity: .16 },
  spine: { position: 'absolute', top: 2, right: 0, bottom: 7, width: 13, borderWidth: 1, borderLeftWidth: 0, borderTopRightRadius: 10, borderBottomRightRadius: 10, overflow: 'hidden' },
  spineShine: { position: 'absolute', left: 2, top: 3, bottom: 3, width: 1, opacity: .38 },
  spineBand: { position: 'absolute', left: 0, right: 0, height: 8, borderTopWidth: 1, borderBottomWidth: 1, opacity: .55 },
  spineBandTop: { top: '15%' },
  spineBandBottom: { bottom: '15%' },
  front: { position: 'absolute', top: 0, right: 7, bottom: 6, left: 0, borderRadius: 11, borderWidth: 1.5, overflow: 'hidden' },
  customImage: { width: '100%', height: '100%' },
  customGlaze: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', borderRadius: 10, backgroundColor: 'rgba(255,255,255,.025)' },
  sheen: { position: 'absolute', top: -24, left: -22, width: '76%', height: '56%', opacity: .055, transform: [{ rotate: '-18deg' }], borderRadius: 60 },
  textureDot: { position: 'absolute', width: 2, height: 2, borderRadius: 1, opacity: .11 },
  textureOne: { left: '12%', top: '14%' },
  textureTwo: { left: '77%', top: '9%' },
  textureThree: { left: '21%', top: '73%' },
  textureFour: { left: '86%', top: '64%' },
  textureFive: { left: '60%', top: '87%' },
  textureSix: { left: '42%', top: '28%' },
  frameOuter: { flex: 1, margin: 8, borderWidth: 1, borderRadius: 7, padding: 4, position: 'relative' },
  frameOuterCompact: { margin: 5, padding: 3, borderRadius: 5 },
  frameInner: { flex: 1, borderWidth: .5, borderRadius: 5, paddingHorizontal: 10, paddingVertical: 14, alignItems: 'center', justifyContent: 'space-between' },
  frameInnerCompact: { paddingHorizontal: 4, paddingVertical: 7, borderRadius: 3 },
  corner: { position: 'absolute', width: 13, height: 13, zIndex: 2 },
  cornerTL: { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 4 },
  cornerTR: { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 4 },
  cornerBL: { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 4 },
  kickerRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  hairline: { flex: 1, height: .5, opacity: .62 },
  kicker: { fontSize: 10, lineHeight: 21, textAlign: 'center', writingDirection: 'rtl', includeFontPadding: true },
  kickerCompact: { fontSize: 7, lineHeight: 14 },
  titleArea: { width: '100%', alignItems: 'center', justifyContent: 'center', flexShrink: 1 },
  title: { width: '100%', textAlign: 'center', writingDirection: 'rtl', fontSize: 24, lineHeight: 45, includeFontPadding: true },
  titleCompact: { fontSize: 17, lineHeight: 31 },
  ornamentRow: { width: '72%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 2 },
  ornament: { fontSize: 13, lineHeight: 17, textAlign: 'center' },
  ornamentCompact: { fontSize: 8, lineHeight: 11 },
  titleRule: { flex: 1, height: .7, opacity: .75 },
  author: { maxWidth: '94%', fontSize: 10, lineHeight: 21, opacity: .94, writingDirection: 'rtl', textAlign: 'center', includeFontPadding: true },
  authorCompact: { fontSize: 7, lineHeight: 14 }
});
