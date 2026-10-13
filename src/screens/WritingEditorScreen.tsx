import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Writing, WritingStatus } from '../types';
import { useApp } from '../store/AppContext';
import { Button, Field, Label, Urdu } from '../components/Ui';
import { useDialog } from '../components/Dialog';
import { fontFamily, getPalette, layout, radii, spacing, typography } from '../theme/theme';
import { PoetryHtml } from '../components/PoetryHtml';
import { htmlToPlainText, plainTextToHtml, wrapSelection } from '../utils/html';

type EditorMode = 'write' | 'preview' | 'source';

const hasRichFormatting = (html: string) => /<(strong|em|u|blockquote)\b|poetry-divider/i.test(html);

export function WritingEditorScreen({ bookId, writing, onClose }: { bookId: string; writing?: Writing; onClose: () => void }) {
  const app = useApp();
  const dialog = useDialog();
  const palette = getPalette(app.readingTheme);
  const initialSource = writing?.content || '<div dir="rtl"><p></p></div>';
  const richExistingContent = useMemo(() => hasRichFormatting(initialSource), [initialSource]);
  const [title, setTitle] = useState(writing?.title || '');
  const [source, setSource] = useState(initialSource);
  const [plain, setPlain] = useState(htmlToPlainText(initialSource));
  const [status, setStatus] = useState<WritingStatus>(writing?.status || 'draft');
  const [mode, setMode] = useState<EditorMode>(richExistingContent ? 'source' : 'write');
  const [saving, setSaving] = useState(false);
  const [selection, setSelection] = useState({ start: source.length - 10, end: source.length - 10 });
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentRef = useRef<Writing | undefined>(writing);
  const saveInFlight = useRef<Promise<Writing> | null>(null);

  const save = async (silent = false) => {
    if (!title.trim() && !htmlToPlainText(source).trim()) return;
    setSaving(true);
    try {
      // A draft autosave and a manual publish can occur almost simultaneously.
      // Wait for the first insert to return its ID before issuing the next update.
      if (saveInFlight.current) await saveInFlight.current.catch(() => undefined);
      const operation = app.saveWriting({ ...currentRef.current, bookId, title: title.trim() || 'Untitled', content: source, status });
      saveInFlight.current = operation;
      const result = await operation;
      currentRef.current = result;
      if (!silent) onClose();
    } catch (error: any) {
      if (!silent) await dialog.alert({ title: 'Unable to save', message: error.message, tone: 'danger' });
    } finally {
      saveInFlight.current = null;
      setSaving(false);
    }
  };

  useEffect(() => {
    if (status !== 'draft' || (!title.trim() && !htmlToPlainText(source).trim())) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => save(true), 1400);
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
  }, [title, source, status]);

  const updatePlain = (value: string) => {
    setPlain(value);
    setSource(plainTextToHtml(value));
  };

  const format = (open: string, close: string) => {
    const result = wrapSelection(source, selection.start, selection.end, open, close);
    setSource(result.text);
    setSelection(result.selection);
    setPlain(htmlToPlainText(result.text));
  };

  const insertDivider = () => {
    if (mode === 'write') {
      const value = plain ? `${plain}\n\n❦ ❦ ❦\n\n` : '❦ ❦ ❦\n\n';
      updatePlain(value);
      return;
    }
    const pos = selection.end;
    const next = source.slice(0, pos) + '<div class="poetry-divider">❦ ❦ ❦</div>' + source.slice(pos);
    setSource(next);
    setPlain(htmlToPlainText(next));
  };

  const switchToWrite = async () => {
    if (hasRichFormatting(source)) {
      const confirmed = await dialog.confirm({
        title: 'Rich formatting detected',
        message: 'Writer mode is plain-text focused. Editing the poem there will simplify rich HTML formatting. You can keep using Source mode to preserve it exactly.',
        confirmLabel: 'Use Writer mode',
        cancelLabel: 'Stay in Source',
        tone: 'warning',
        icon: 'code-slash-outline'
      });
      if (!confirmed) return;
    }
    setPlain(htmlToPlainText(source));
    setMode('write');
  };

  return <View style={[styles.root, { backgroundColor: palette.bg }]}>
    <View style={[styles.header, { borderBottomColor: palette.border }]}>
      <Button compact variant="ghost" title="Cancel" onPress={onClose} />
      <View style={styles.headerTitle}>
        <Urdu style={styles.heading}>{writing ? 'Edit Poem' : 'New Poem'}</Urdu>
        <Label style={{ color: palette.muted }}>{saving ? 'Saving…' : status === 'draft' ? 'Draft autosaved' : 'Published'}</Label>
      </View>
      <Button compact title="Save" onPress={() => save(false)} disabled={saving} />
    </View>

    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Field label="Poem title" rtl style={styles.titleField} value={title} onChangeText={setTitle} placeholder="عنوان" />

      <View style={styles.publication}>
        <View style={styles.publicationCopy}>
          <Label style={styles.publicationTitle}>Publication</Label>
          <Label style={{ color: palette.muted }}>{status === 'draft' ? 'Only you can see this poem.' : 'Readers can see this poem.'}</Label>
        </View>
        <View style={[styles.segment, { backgroundColor: palette.surface2, borderColor: palette.border }]}>
          {(['draft', 'published'] as WritingStatus[]).map(item => <Pressable
            key={item}
            onPress={() => setStatus(item)}
            style={({ pressed }) => [styles.segmentItem, status === item && { backgroundColor: palette.surface, borderColor: palette.borderStrong }, pressed && styles.pressed]}
          >
            <Label style={[styles.segmentText, { color: status === item ? palette.text : palette.muted }]}>{item === 'draft' ? 'Draft' : 'Published'}</Label>
          </Pressable>)}
        </View>
      </View>

      <View style={[styles.modeBar, { borderBottomColor: palette.border }]}>
        <View style={styles.modeTabs}>
          <ModeButton active={mode === 'write'} label="Write" onPress={() => void switchToWrite()} />
          <ModeButton active={mode === 'preview'} label="Preview" onPress={() => setMode('preview')} />
          <ModeButton active={mode === 'source'} label="Source" onPress={() => setMode('source')} />
        </View>
        <Pressable accessibilityLabel="Insert divider" onPress={insertDivider} style={({ pressed }) => [styles.dividerButton, { borderColor: palette.border }, pressed && styles.pressed]}>
          <Text style={[styles.dividerGlyph, { color: palette.gold }]}>❦</Text>
        </Pressable>
      </View>

      {mode === 'write' ? <View>
        <TextInput
          multiline
          value={plain}
          onChangeText={updatePlain}
          selectionColor={palette.accent}
          placeholder="یہاں اپنی نظم یا غزل لکھیں…"
          placeholderTextColor={palette.muted}
          style={[styles.writer, { backgroundColor: palette.input, borderColor: palette.border, color: palette.text, fontFamily }]}
          textAlign="right"
          textAlignVertical="top"
        />
        <Label style={[styles.help, { color: palette.muted }]}>Writer mode keeps the canvas clean and stores the poem using the existing HTML format automatically.</Label>
      </View> : null}

      {mode === 'preview' ? <View style={[styles.preview, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
        <Urdu style={styles.previewTitle}>{title || 'Untitled'}</Urdu>
        <View style={[styles.previewRule, { backgroundColor: palette.border }]} />
        <PoetryHtml html={source} color={palette.text} fontSize={typography.urdu.poetry.fontSize} lineHeight={typography.urdu.poetry.lineHeight} />
      </View> : null}

      {mode === 'source' ? <View>
        {richExistingContent ? <View style={[styles.notice, { backgroundColor: palette.warningBg }]}><Ionicons name="information-circle-outline" size={18} color={palette.warning} /><Label style={[styles.noticeText, { color: palette.warning }]}>This poem contains rich formatting. Source mode preserves it exactly.</Label></View> : null}
        <View style={[styles.toolbar, { borderColor: palette.border, backgroundColor: palette.surface2 }]}>
          <Tool label="B" onPress={() => format('<strong>', '</strong>')} />
          <Tool label="I" onPress={() => format('<em>', '</em>')} />
          <Tool label="U" onPress={() => format('<u>', '</u>')} />
          <Tool label="❝" onPress={() => format('<blockquote>', '</blockquote>')} />
          <Tool label="RTL" onPress={() => format('<div dir="rtl">', '</div>')} />
        </View>
        <TextInput
          multiline
          value={source}
          onChangeText={value => { setSource(value); setPlain(htmlToPlainText(value)); }}
          onSelectionChange={event => setSelection(event.nativeEvent.selection)}
          selection={selection}
          selectionColor={palette.accent}
          placeholderTextColor={palette.muted}
          style={[styles.sourceEditor, { backgroundColor: palette.input, borderColor: palette.border, color: palette.text }]}
          autoCapitalize="none"
          autoCorrect={false}
          textAlignVertical="top"
        />
        <View style={styles.cleanRow}><Button variant="secondary" title="Clean formatting" onPress={() => { const next = plainTextToHtml(htmlToPlainText(source)); setSource(next); setPlain(htmlToPlainText(next)); }} /></View>
      </View> : null}
    </ScrollView>
  </View>;
}

function ModeButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  const palette = getPalette(useApp().readingTheme);
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.modeButton, active && { borderBottomColor: palette.accentStrong }, pressed && styles.pressed]}>
    <Label style={[styles.modeText, { color: active ? palette.text : palette.muted }]}>{label}</Label>
  </Pressable>;
}

function Tool({ label, onPress }: { label: string; onPress: () => void }) {
  const palette = getPalette(useApp().readingTheme);
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.tool, { backgroundColor: palette.input, borderColor: palette.border }, pressed && styles.pressed]}>
    <Text style={[styles.toolText, { color: palette.accentStrong }]}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { minHeight: 66, paddingHorizontal: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitle: { flex: 1, alignItems: 'center' },
  heading: { fontSize: typography.urdu.section.fontSize, lineHeight: typography.urdu.section.lineHeight, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center', padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.xl },
  titleField: { fontFamily, fontSize: typography.urdu.body.fontSize, lineHeight: typography.urdu.body.lineHeight },
  publication: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  publicationCopy: { flex: 1 },
  publicationTitle: { fontWeight: '700', marginBottom: 2 },
  segment: { flexDirection: 'row', borderWidth: 1, borderRadius: radii.control, padding: 3 },
  segmentItem: { minHeight: 36, minWidth: 72, borderRadius: radii.small, borderWidth: 1, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  segmentText: { fontWeight: '700' },
  modeBar: { minHeight: 48, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modeTabs: { flexDirection: 'row', alignItems: 'stretch' },
  modeButton: { minHeight: 48, minWidth: 68, borderBottomWidth: 2, borderBottomColor: 'transparent', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  modeText: { fontWeight: '700' },
  dividerButton: { width: 42, height: 38, borderRadius: radii.small, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dividerGlyph: { fontSize: 16 },
  writer: { minHeight: 440, borderWidth: 1, borderRadius: radii.card, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl, fontSize: typography.urdu.body.fontSize, lineHeight: 42, writingDirection: 'rtl', includeFontPadding: true },
  help: { marginTop: spacing.sm },
  preview: { minHeight: 440, borderWidth: 1, borderRadius: radii.card, padding: spacing.xl },
  previewTitle: { fontSize: typography.urdu.title.fontSize, lineHeight: typography.urdu.title.lineHeight, fontWeight: '700', textAlign: 'center' },
  previewRule: { width: 54, height: 1, alignSelf: 'center', marginTop: spacing.md, marginBottom: spacing.xl },
  notice: { borderRadius: radii.control, padding: spacing.md, marginBottom: spacing.md, flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  noticeText: { flex: 1 },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, borderWidth: 1, borderRadius: radii.control, padding: spacing.sm, marginBottom: spacing.sm },
  tool: { minWidth: 44, height: 44, borderRadius: radii.small, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  toolText: { fontWeight: '800' },
  sourceEditor: { minHeight: 360, borderWidth: 1, borderRadius: radii.card, padding: spacing.lg, fontSize: 13, lineHeight: 21, fontFamily: 'monospace' },
  cleanRow: { marginTop: spacing.md },
  pressed: { opacity: .68, transform: [{ scale: .985 }] }
});
