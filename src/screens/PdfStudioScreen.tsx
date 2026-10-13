import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  NotoNastaliqUrdu_400Regular,
  NotoNastaliqUrdu_500Medium,
  NotoNastaliqUrdu_600SemiBold,
  NotoNastaliqUrdu_700Bold
} from '@expo-google-fonts/noto-nastaliq-urdu';
import { Book } from '../types';
import { useApp } from '../store/AppContext';
import { Button, EmptyState, Label, ScreenHeader, SectionTitle, Urdu } from '../components/Ui';
import { useDialog } from '../components/Dialog';
import { getPalette, layout, radii, spacing, typography } from '../theme/theme';

function esc(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safePoetryHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<div[^>]*class=["'][^"']*poetry-divider[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '<div class="poetry-divider"><span></span><b>❦</b><span></span></div>')
    .replace(/<hr\s*\/?\s*>/gi, '<div class="poetry-divider"><span></span><b>❦</b><span></span></div>')
    // The native reader renders every paragraph ending as a real stanza spacer.
    // Keep that same separation in print instead of relying on collapsible margins.
    .replace(/<\/p>/gi, '</p><div class="stanza-gap" aria-hidden="true"></div>')
    // Preserve authored blank lines that may exist in older/rich HTML content.
    .replace(/(?:<br\s*\/?\s*>\s*){2,}/gi, '<br /><span class="stanza-break" aria-hidden="true"></span>');
}

async function fontData(module: number) {
  const asset = Asset.fromModule(module);
  if (!asset.localUri) await asset.downloadAsync();
  const uri = asset.localUri || asset.uri;
  if (!uri) throw new Error('Unable to load the app font for PDF export.');
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
}

async function appFontCss() {
  const [regular, medium, semibold, bold] = await Promise.all([
    fontData(NotoNastaliqUrdu_400Regular),
    fontData(NotoNastaliqUrdu_500Medium),
    fontData(NotoNastaliqUrdu_600SemiBold),
    fontData(NotoNastaliqUrdu_700Bold)
  ]);
  return `
    @font-face{font-family:'RazaNastaliq';src:url(data:font/ttf;base64,${regular}) format('truetype');font-weight:400;font-style:normal}
    @font-face{font-family:'RazaNastaliq';src:url(data:font/ttf;base64,${medium}) format('truetype');font-weight:500;font-style:normal}
    @font-face{font-family:'RazaNastaliq';src:url(data:font/ttf;base64,${semibold}) format('truetype');font-weight:600;font-style:normal}
    @font-face{font-family:'RazaNastaliq';src:url(data:font/ttf;base64,${bold}) format('truetype');font-weight:700;font-style:normal}
  `;
}

export function PdfStudioScreen({ book, onClose }: { book?: Book; onClose?: () => void }) {
  const app = useApp();
  const dialog = useDialog();
  const palette = getPalette(app.readingTheme);
  const [busy, setBusy] = useState(false);

  const generate = async (target?: Book) => {
    setBusy(true);
    try {
      const selected = target ? [target] : app.books.filter(item => item.status === 'published');
      const fonts = await appFontCss();
      const authorName = app.author?.authorNameUrdu || app.author?.authorName || '';
      const papers: string[] = [];

      selected.forEach(selectedBook => {
        const writings = app.writings
          .filter(writing => writing.bookId === selectedBook.id && writing.status === 'published')
          .sort((first, second) => first.orderIndex - second.orderIndex);

        writings.forEach((writing, index) => {
          papers.push(`
            <article class="reading-paper">
              <div class="book-name">${esc(selectedBook.title)}</div>
              <h1>${esc(writing.title)}</h1>
              <div class="author">${esc(authorName)}</div>
              <div class="title-rule"></div>
              <div class="poetry">${safePoetryHtml(writing.content)}</div>
              <div class="end-rule"></div>
              <div class="page-count">${index + 1} of ${writings.length}</div>
            </article>
          `);
        });
      });

      if (!papers.length) {
        await dialog.alert({ title: 'Nothing to export', message: 'There are no published poems to export.', tone: 'info', icon: 'document-outline' });
        return;
      }

      const html = `<!doctype html>
        <html dir="rtl">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <style>
              ${fonts}
              @page{size:A4;margin:12mm}
              *{box-sizing:border-box}
              html,body{margin:0;padding:0;background:${palette.bg};color:${palette.text};direction:rtl;-webkit-print-color-adjust:exact;print-color-adjust:exact}
              body{font-family:'RazaNastaliq',serif}
              .reading-paper{
                width:100%;
                min-height:267mm;
                margin:0;
                padding:14mm 12mm 12mm;
                border:1px solid ${palette.border};
                border-radius:16px;
                background:${palette.elevated};
                text-align:center;
              }
              .reading-paper + .reading-paper{page-break-before:always;break-before:page}
              .book-name{font-size:10px;line-height:18px;color:${palette.muted};opacity:.85;margin-bottom:10px;text-align:center}
              h1{font-family:'RazaNastaliq',serif;font-size:26px;line-height:50px;font-weight:700;margin:0;text-align:center;color:${palette.text}}
              .author{font-size:13px;line-height:28px;color:${palette.muted};margin-top:-2px;text-align:center}
              .title-rule,.end-rule{width:56px;height:1px;background:${palette.border};margin-left:auto;margin-right:auto}
              .title-rule{margin-top:16px;margin-bottom:22px}
              .end-rule{margin-top:28px;margin-bottom:12px}
              .poetry{width:100%;font-size:20px;line-height:50px;text-align:center;color:${palette.text};white-space:pre-line;overflow-wrap:anywhere}
              .poetry p{margin:0;padding:3px 0 6px;text-align:center;line-height:50px;white-space:pre-line}
              .poetry br{line-height:50px}
              .stanza-gap{display:block;width:100%;height:15px;break-inside:avoid;page-break-inside:avoid}
              .stanza-break{display:block;width:100%;height:15px}
              .poetry strong,.poetry b{font-weight:700}
              .poetry em,.poetry i{font-weight:500;font-style:normal;opacity:.86}
              .poetry u{text-decoration:underline}
              .poetry blockquote{margin:4px 0;padding:2px 12px 2px 4px;border-right:1.5px solid ${palette.text};opacity:.92;text-align:center}
              .poetry-divider{width:58%;margin:13px auto;display:flex;align-items:center;gap:10px;color:${palette.text};opacity:.7}
              .poetry-divider span{height:1px;background:${palette.text};opacity:.28;flex:1}
              .poetry-divider b{font-family:'RazaNastaliq',serif;font-size:14px;font-weight:400}
              .page-count{font-family:Arial,sans-serif;font-size:10px;line-height:16px;color:${palette.muted};direction:ltr;text-align:center}
            </style>
          </head>
          <body>${papers.join('')}</body>
        </html>`;

      const file = await Print.printToFileAsync({ html, base64: true });
      const cacheRoot = FileSystem.cacheDirectory;
      if (!cacheRoot) throw new Error('Unable to access app cache for PDF sharing.');
      if (!file.base64) throw new Error('The generated PDF data is unavailable.');

      const safeTitle = (target?.title || 'kalam-e-raza')
        .trim()
        .replace(/[^\p{L}\p{N}._-]+/gu, '-')
        .replace(/^-+|-+$/g, '') || 'kalam-e-raza';
      const shareUri = `${cacheRoot}${safeTitle}-${Date.now()}.pdf`;
      await FileSystem.writeAsStringAsync(shareUri, file.base64, {
        encoding: FileSystem.EncodingType.Base64
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(shareUri, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
          dialogTitle: target ? `${target.title} PDF` : 'Kalam e Raza PDF'
        });
      } else {
        await dialog.alert({ title: 'PDF ready', message: shareUri, tone: 'success', icon: 'checkmark-circle-outline' });
      }
    } catch (error: any) {
      await dialog.alert({ title: 'Unable to create PDF', message: error?.message || 'Unable to create the PDF.', tone: 'danger' });
    } finally {
      setBusy(false);
    }
  };

  const publishedBooks = app.books.filter(item => item.status === 'published');

  const selectedBookCount = book ? 1 : publishedBooks.length;
  const selectedPoemCount = book
    ? app.writings.filter(item => item.bookId === book.id && item.status === 'published').length
    : app.writings.filter(item => item.status === 'published' && publishedBooks.some(published => published.id === item.bookId)).length;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: palette.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="PDF Studio" subtitle="Export the reading experience as a book" onClose={onClose} />

      <View style={styles.intro}>
        <View style={[styles.heroIcon, { backgroundColor: palette.accentSoft }]}><Ionicons name="print-outline" size={24} color={palette.accentStrong} /></View>
        <View style={styles.introCopy}><SectionTitle title={book ? book.title : 'Published collection'} subtitle="The PDF uses the app Nastaliq font and starts every poem on a new page." /></View>
      </View>

      <View style={[styles.summary, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Metric value={selectedBookCount} label={selectedBookCount === 1 ? 'Book' : 'Books'} />
        <View style={[styles.summaryDivider, { backgroundColor: palette.border }]} />
        <Metric value={selectedPoemCount} label={selectedPoemCount === 1 ? 'Poem' : 'Poems'} />
        <View style={[styles.summaryDivider, { backgroundColor: palette.border }]} />
        <View style={styles.summaryItem}><Ionicons name="text-outline" size={20} color={palette.accentStrong} /><Text style={[styles.summaryLabelStrong, { color: palette.text }]}>App font</Text></View>
      </View>

      <View style={[styles.exportPanel, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={styles.exportCopy}>
          <Text style={[styles.panelTitle, { color: palette.text }]}>{book ? 'Export this book' : 'Export all published books'}</Text>
          <Text style={[styles.panelDescription, { color: palette.muted }]}>{selectedPoemCount ? `${selectedPoemCount} published ${selectedPoemCount === 1 ? 'poem' : 'poems'} ready for export.` : 'Publish at least one poem before creating a PDF.'}</Text>
        </View>
        <Button title={busy ? 'Creating PDF…' : 'Create PDF'} icon="download-outline" onPress={() => generate(book)} disabled={busy || selectedPoemCount === 0} loading={busy} />
      </View>

      {!book ? <View style={styles.bookSection}>
        <SectionTitle title="Export one book" subtitle="Choose a published collection if you only need a single book." />
        {publishedBooks.length ? <View style={[styles.bookList, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          {publishedBooks.map((item, index) => {
            const count = app.writings.filter(writing => writing.bookId === item.id && writing.status === 'published').length;
            return <Pressable key={item.id} onPress={() => !busy && generate(item)} disabled={busy || count === 0} style={({ pressed }) => [styles.bookRow, index > 0 && { borderTopColor: palette.border, borderTopWidth: StyleSheet.hairlineWidth }, pressed && styles.pressed, count === 0 && styles.disabled]}>
              <View style={[styles.bookIcon, { backgroundColor: palette.surface2 }]}><Ionicons name="book-outline" size={19} color={palette.accentStrong} /></View>
              <View style={styles.bookCopy}><Urdu numberOfLines={1} style={styles.bookTitle}>{item.title}</Urdu><Label style={{ color: palette.muted }}>{count} published {count === 1 ? 'poem' : 'poems'}</Label></View>
              <Ionicons name="download-outline" size={19} color={count ? palette.accentStrong : palette.muted} />
            </Pressable>;
          })}
        </View> : <EmptyState icon="book-outline" title="No published books" message="Publish a collection and at least one poem before exporting a PDF." />}
      </View> : null}
    </ScrollView>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  const palette = getPalette(useApp().readingTheme);
  return <View style={styles.summaryItem}><Text style={[styles.metricValue, { color: palette.text }]}>{value}</Text><Text style={[styles.summaryLabel, { color: palette.muted }]}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.xl },
  intro: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.sm },
  heroIcon: { width: 52, height: 52, borderRadius: radii.card, alignItems: 'center', justifyContent: 'center' },
  introCopy: { flex: 1 },
  summary: { minHeight: 84, borderWidth: 1, borderRadius: radii.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md },
  summaryItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  metricValue: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
  summaryLabel: { ...typography.latin.caption },
  summaryLabelStrong: { ...typography.latin.caption, fontWeight: '700' },
  summaryDivider: { width: StyleSheet.hairlineWidth, height: 38 },
  exportPanel: { borderWidth: 1, borderRadius: radii.card, padding: spacing.lg, gap: spacing.lg },
  exportCopy: { gap: 4 },
  panelTitle: { ...typography.latin.section, fontWeight: '800' },
  panelDescription: { ...typography.latin.small },
  bookSection: { gap: spacing.md },
  bookList: { borderWidth: 1, borderRadius: radii.card, overflow: 'hidden' },
  bookRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  bookIcon: { width: 42, height: 42, borderRadius: radii.control, alignItems: 'center', justifyContent: 'center' },
  bookCopy: { flex: 1, minWidth: 0 },
  bookTitle: { fontSize: 15, lineHeight: 31, fontWeight: '700', textAlign: 'left' },
  pressed: { opacity: .72 },
  disabled: { opacity: .45 }
});
