import React from 'react';
import { StyleSheet, Text, TextStyle, View } from 'react-native';
import { nastaliqWeights } from '../theme/theme';

type Flags = { bold: boolean; italic: boolean; underline: boolean; quote: boolean };
type Segment = { text: string; flags: Flags };

const notoFamilies: string[] = Object.values(nastaliqWeights);

function decode(s: string) {
  return s
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function toLines(html: string) {
  return html
    .replace(/<div[^>]*class=["'][^"']*poetry-divider[^"']*["'][^>]*>.*?<\/div>/gis, '\n__DIVIDER__\n')
    .replace(/<hr\s*\/?\s*>/gi, '\n__DIVIDER__\n')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<\/div>/gi, '')
    .split('\n');
}

function parseInline(line: string): Segment[] {
  const tokens = line.split(/(<\/?(?:strong|b|em|i|u|blockquote)>)/gi);
  const flags: Flags = { bold: false, italic: false, underline: false, quote: false };
  const out: Segment[] = [];
  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (/^<(strong|b)>$/.test(lower)) flags.bold = true;
    else if (/^<\/(strong|b)>$/.test(lower)) flags.bold = false;
    else if (/^<(em|i)>$/.test(lower)) flags.italic = true;
    else if (/^<\/(em|i)>$/.test(lower)) flags.italic = false;
    else if (lower === '<u>') flags.underline = true;
    else if (lower === '</u>') flags.underline = false;
    else if (lower === '<blockquote>') flags.quote = true;
    else if (lower === '</blockquote>') flags.quote = false;
    else {
      const clean = decode(token.replace(/<[^>]+>/g, ''));
      if (clean) out.push({ text: clean, flags: { ...flags } });
    }
  }
  return out;
}

function familyForSegment(baseFamily: string, flags: Flags) {
  if (!notoFamilies.includes(baseFamily)) return baseFamily;
  if (flags.bold) return nastaliqWeights.bold;
  if (flags.italic || flags.quote) return nastaliqWeights.medium;
  return baseFamily;
}

function PoetryDivider({ color, fontFamily }: { color: string; fontFamily: string }) {
  return <View style={styles.dividerRow}>
    <View style={[styles.dividerRule, { backgroundColor: color }]} />
    <Text style={[styles.divider, { color, fontFamily }]}>❦</Text>
    <View style={[styles.dividerRule, { backgroundColor: color }]} />
  </View>;
}

export function PoetryHtml({ html, color, fontSize = 21, lineHeight = 48, selectable = false, fontFamily = nastaliqWeights.regular }: { html: string; color: string; fontSize?: number; lineHeight?: number; selectable?: boolean; fontFamily?: string }) {
  const lines = toLines(html);
  const safeLineHeight = Math.max(lineHeight, Math.ceil(fontSize * 1.85));
  const stanzaGap = Math.max(12, Math.round(safeLineHeight * .3));

  return <View style={styles.container}>{lines.map((line, index) => {
    if (line === '__DIVIDER__') return <PoetryDivider key={`divider-${index}`} color={color} fontFamily={fontFamily} />;
    if (!line.trim()) return <View key={`space-${index}`} style={{ height: stanzaGap }} />;

    const segments = parseInline(line);
    const quoted = segments.some(segment => segment.flags.quote);
    const verse = <Text
      selectable={selectable}
      style={[styles.line, { color, fontSize, lineHeight: safeLineHeight, minHeight: safeLineHeight + 6, fontFamily }]}
    >
      {segments.map((segment, segmentIndex) => {
        const segmentStyle: TextStyle = {
          fontFamily: familyForSegment(fontFamily, segment.flags),
          opacity: segment.flags.italic ? .86 : 1,
          textDecorationLine: segment.flags.underline ? 'underline' : 'none'
        };
        return <Text key={segmentIndex} style={segmentStyle}>{segment.text}</Text>;
      })}
    </Text>;

    return quoted
      ? <View key={`quote-${index}`} style={[styles.quote, { borderRightColor: color }]}>{verse}</View>
      : React.cloneElement(verse, { key: `line-${index}` });
  })}</View>;
}

const styles = StyleSheet.create({
  container: { width: '100%', alignItems: 'stretch' },
  line: { width: '100%', paddingTop: 3, paddingBottom: 3, textAlign: 'center', textAlignVertical: 'center', writingDirection: 'rtl', includeFontPadding: true },
  dividerRow: { width: '58%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 13 },
  dividerRule: { flex: 1, height: .7, opacity: .28 },
  divider: { fontSize: 14, lineHeight: 24, opacity: .7, textAlign: 'center', includeFontPadding: true },
  quote: { width: '100%', borderRightWidth: 1.5, paddingRight: 12, paddingLeft: 4, marginVertical: 4, opacity: .92 }
});
