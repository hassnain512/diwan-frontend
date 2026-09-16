import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Book } from '../types';
import { useApp } from '../store/AppContext';
import { htmlToPlainText } from '../utils/html';
import { Button, Card, Urdu } from '../components/Ui';
import { getPalette } from '../theme/theme';

function esc(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');
}

export function PdfStudioScreen({ book, onClose }: { book?: Book; onClose: () => void }) {
  const app = useApp();
  const palette = getPalette(app.readingTheme);
  const [busy, setBusy] = useState(false);

  const generate = async (target?: Book) => {
    setBusy(true);
    try {
      const selected = target ? [target] : app.books.filter(item => item.status === 'published');
      const sections = selected
        .map(selectedBook => {
          const writings = app.writings
            .filter(writing => writing.bookId === selectedBook.id && writing.status === 'published')
            .sort((first, second) => first.orderIndex - second.orderIndex);
          const articles = writings
            .map(writing => '<article><h2>' + esc(writing.title) + '</h2><div class="poem">' + esc(htmlToPlainText(writing.content)) + '</div></article>')
            .join('');
          return '<section><h1>' + esc(selectedBook.title) + '</h1>' + articles + '</section>';
        })
        .join('');
      const html = '<html dir="rtl"><head><meta charset="utf-8"><style>body{font-family:serif;background:#fffaf1;color:#2d2926;padding:36px;direction:rtl}h1,h2{text-align:center}h1{font-size:32px;margin:30px 0}h2{font-size:22px;margin-top:36px}.poem{text-align:center;font-size:19px;line-height:2.3;white-space:normal}article{page-break-inside:avoid;margin-bottom:40px}section{page-break-after:always}</style></head><body><div style="text-align:center"><h1>Kalam E Raza</h1><p>' + esc(app.author?.authorName || '') + '</p></div>' + sections + '</body></html>';
      const file = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'Kalam e Raza PDF' });
      } else {
        Alert.alert('PDF', file.uri);
      }
    } catch (error: any) {
      Alert.alert('PDF', error.message);
    } finally {
      setBusy(false);
    }
  };

  const publishedBooks = app.books.filter(item => item.status === 'published');

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: palette.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { borderBottomColor: palette.border }]}>
        <Button compact variant="ghost" title="Close" onPress={onClose} />
        <View style={styles.headerTitle}>
          <Urdu style={styles.heading}>PDF Studio</Urdu>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <Card style={[styles.card, { borderColor: palette.border }]}>
        <View style={styles.cardHead}>
          <View style={styles.cardCopy}>
            <Urdu style={styles.title}>{book ? book.title : 'Published Collection'}</Urdu>
          </View>
          <View style={[styles.iconTile, { backgroundColor: palette.surface2 }]}>
            <Ionicons name="print-outline" size={24} color={palette.accent} />
          </View>
        </View>
        <Button
          title={busy ? 'Creating PDF…' : 'Create PDF'}
          icon="print-outline"
          onPress={() => generate(book)}
          disabled={busy}
        />
      </Card>

      {!book ? (
        <Card style={[styles.card, { borderColor: palette.border }]}>
          <Urdu style={styles.title}>Individual Book</Urdu>
          <View style={styles.bookList}>
            {publishedBooks.map(item => (
              <Button key={item.id} variant="secondary" title={item.title} onPress={() => generate(item)} />
            ))}
            {!publishedBooks.length ? (
              <Urdu style={[styles.empty, { color: palette.muted }]}>No published books</Urdu>
            ) : null}
          </View>
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 14, gap: 12, paddingBottom: 44 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 10,
    marginBottom: 2
  },
  headerTitle: { alignItems: 'center', flex: 1 },
  headerSpacer: { width: 68 },
  kicker: { fontSize: 8, lineHeight: 15, letterSpacing: 0.6 },
  heading: { fontSize: 22, lineHeight: 36, fontWeight: '900', textAlign: 'center' },
  card: { gap: 14, paddingTop: 18 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardCopy: { flex: 1, alignItems: 'flex-start' },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: { fontSize: 18, lineHeight: 30, fontWeight: '900', textAlign: 'left' },
  body: { fontSize: 11, lineHeight: 22, textAlign: 'right' },
  bookList: { gap: 8 },
  empty: { fontSize: 11, lineHeight: 22, textAlign: 'center', paddingVertical: 12 }
});

