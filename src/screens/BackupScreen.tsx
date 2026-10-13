import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { repository } from '../services/repository';
import { useApp } from '../store/AppContext';
import { BackupData } from '../types';
import { Button, Label, ScreenHeader, SectionTitle } from '../components/Ui';
import { useDialog } from '../components/Dialog';
import { getPalette, layout, radii, spacing, typography } from '../theme/theme';

export function BackupScreen({ onClose }: { onClose?: () => void }) {
  const app = useApp();
  const dialog = useDialog();
  const [busy, setBusy] = useState<'export' | 'restore' | null>(null);
  const palette = getPalette(app.readingTheme);

  const exportBackup = async () => {
    setBusy('export');
    let path: string | undefined;
    try {
      const data = await repository.exportBackup();
      path = `${FileSystem.cacheDirectory}diwan-backup-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(path, JSON.stringify(data, null, 2));
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Diwan Backup' });
      else await dialog.alert({ title: 'Backup ready', message: path, tone: 'success', icon: 'checkmark-circle-outline' });
    } catch (error: any) {
      await dialog.alert({ title: 'Unable to export backup', message: error?.message || 'Please try again.', tone: 'danger' });
    } finally {
      if (path) await FileSystem.deleteAsync(path, { idempotent: true }).catch(() => undefined);
      setBusy(null);
    }
  };

  const restore = async () => {
    setBusy('restore');
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
      if (result.canceled) return;
      const raw = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const data = JSON.parse(raw) as BackupData;
      if (!data.authorProfile || !Array.isArray(data.books) || !Array.isArray(data.writings) || !Array.isArray(data.readers)) throw new Error('This file is not a valid Diwan backup.');
      await repository.restoreBackup(data);
      await app.refresh();
      await dialog.alert({ title: 'Backup restored', message: 'Your library, poems, readers and author profile are up to date.', tone: 'success', icon: 'checkmark-circle-outline' });
    } catch (error: any) {
      await dialog.alert({ title: 'Unable to restore backup', message: error?.message || 'Choose a valid Diwan backup and try again.', tone: 'danger' });
    } finally {
      setBusy(null);
    }
  };

  return <ScrollView style={[styles.root, { backgroundColor: palette.bg }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <ScreenHeader title="Backup & Restore" subtitle="Keep a portable copy of your private library" onClose={onClose} />

    <View style={styles.intro}>
      <View style={[styles.heroIcon, { backgroundColor: palette.accentSoft }]}><Ionicons name="shield-checkmark-outline" size={25} color={palette.accentStrong} /></View>
      <View style={styles.introCopy}>
        <SectionTitle title="Your library, safely portable" subtitle="Export one file containing the current author profile, collections, poems and reader accounts." />
      </View>
    </View>

    <View style={[styles.summary, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <Summary value={app.books.length} label="Collections" />
      <View style={[styles.summaryDivider, { backgroundColor: palette.border }]} />
      <Summary value={app.writings.length} label="Poems" />
      <View style={[styles.summaryDivider, { backgroundColor: palette.border }]} />
      <Summary value={app.readers.length} label="Readers" />
    </View>

    <View style={styles.section}>
      <ActionPanel
        icon="download-outline"
        title="Export backup"
        description="Create a JSON backup and save or share it somewhere you trust."
        action={<Button title="Export backup" icon="download-outline" onPress={exportBackup} loading={busy === 'export'} disabled={busy !== null && busy !== 'export'} />}
      />
      <ActionPanel
        icon="cloud-upload-outline"
        title="Restore backup"
        description="Choose a Diwan backup file. Restoring replaces the current local library with the selected backup."
        tone="warning"
        action={<Button variant="secondary" title="Choose backup file" icon="document-outline" onPress={restore} loading={busy === 'restore'} disabled={busy !== null && busy !== 'restore'} />}
      />
    </View>

    <View style={[styles.note, { backgroundColor: palette.surface2, borderColor: palette.border }]}>
      <Ionicons name="information-circle-outline" size={18} color={palette.muted} />
      <Label style={[styles.noteText, { color: palette.muted }]}>Store exported backups privately. They can contain reader account and unpublished writing data.</Label>
    </View>
  </ScrollView>;
}

function Summary({ value, label }: { value: number; label: string }) {
  const palette = getPalette(useApp().readingTheme);
  return <View style={styles.summaryItem}><Text style={[styles.summaryValue, { color: palette.text }]}>{value}</Text><Text style={[styles.summaryLabel, { color: palette.muted }]}>{label}</Text></View>;
}

function ActionPanel({ icon, title, description, action, tone = 'normal' }: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string; action: React.ReactNode; tone?: 'normal' | 'warning' }) {
  const palette = getPalette(useApp().readingTheme);
  const iconBackground = tone === 'warning' ? palette.warningBg : palette.accentSoft;
  const iconColor = tone === 'warning' ? palette.warning : palette.accentStrong;
  return <View style={[styles.panel, { backgroundColor: palette.surface, borderColor: palette.border }]}>
    <View style={styles.panelTop}>
      <View style={[styles.panelIcon, { backgroundColor: iconBackground }]}><Ionicons name={icon} size={22} color={iconColor} /></View>
      <View style={styles.panelCopy}><Text style={[styles.panelTitle, { color: palette.text }]}>{title}</Text><Text style={[styles.panelDescription, { color: palette.muted }]}>{description}</Text></View>
    </View>
    {action}
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.xl },
  intro: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.sm },
  heroIcon: { width: 52, height: 52, borderRadius: radii.card, alignItems: 'center', justifyContent: 'center' },
  introCopy: { flex: 1 },
  summary: { minHeight: 84, borderWidth: 1, borderRadius: radii.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md },
  summaryItem: { flex: 1, alignItems: 'center', gap: 2 },
  summaryValue: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
  summaryLabel: { ...typography.latin.caption },
  summaryDivider: { width: StyleSheet.hairlineWidth, height: 38 },
  section: { gap: spacing.md },
  panel: { borderWidth: 1, borderRadius: radii.card, padding: spacing.lg, gap: spacing.lg },
  panelTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  panelIcon: { width: 46, height: 46, borderRadius: radii.control, alignItems: 'center', justifyContent: 'center' },
  panelCopy: { flex: 1, gap: 3 },
  panelTitle: { ...typography.latin.section, fontWeight: '800' },
  panelDescription: { ...typography.latin.small },
  note: { borderWidth: 1, borderRadius: radii.control, padding: spacing.md, flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  noteText: { flex: 1, lineHeight: 18 }
});
