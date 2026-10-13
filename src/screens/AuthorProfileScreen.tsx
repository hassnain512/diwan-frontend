import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../store/AppContext';
import { Button, Field, Label, ScreenHeader, Urdu } from '../components/Ui';
import { useDialog } from '../components/Dialog';
import { fontFamily, getPalette, layout, radii, spacing, typography } from '../theme/theme';

export function AuthorProfileScreen({ onClose }: { onClose?: () => void }) {
  const app = useApp();
  const dialog = useDialog();
  const isAdmin = app.session?.role === 'admin';
  const author = app.author;
  const palette = getPalette(app.readingTheme);
  const [editing, setEditing] = useState(false);
  const [authorNameUrdu, setAuthorNameUrdu] = useState(author?.authorNameUrdu || '');
  const [penNameUrdu, setPenNameUrdu] = useState(author?.penNameUrdu || '');
  const [biography, setBiography] = useState(author?.biography || '');
  const [introduction, setIntroduction] = useState(author?.introduction || '');
  const [profileImage, setProfileImage] = useState(author?.profileImage || '');
  if (!author) return null;

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: .9 });
    if (!result.canceled) setProfileImage(result.assets[0].uri);
  };
  const save = async () => {
    try {
      await app.saveAuthor({ authorNameUrdu, penNameUrdu, biography, introduction, profileImage });
      setEditing(false);
    } catch (error: any) {
      await dialog.alert({ title: 'Author profile', message: error.message, tone: 'danger' });
    }
  };
  const cancel = () => {
    setAuthorNameUrdu(author.authorNameUrdu || ''); setPenNameUrdu(author.penNameUrdu || ''); setBiography(author.biography || ''); setIntroduction(author.introduction || ''); setProfileImage(author.profileImage || ''); setEditing(false);
  };

  return <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView style={[styles.root, { backgroundColor: palette.bg }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
      <ScreenHeader title="Author Profile" subtitle={isAdmin ? 'Public author identity' : 'About the author'} onClose={onClose} action={isAdmin ? <Button compact variant="secondary" title={editing ? 'Cancel' : 'Edit'} onPress={editing ? cancel : () => setEditing(true)} /> : undefined} />

      <View style={styles.hero}>
        <View style={[styles.photoRing, { borderColor: palette.border, backgroundColor: palette.surface2 }]}><Image source={profileImage ? { uri: profileImage } : require('../../assets/Raza  Logo.png')} style={styles.photo} /></View>
        {editing ? <Button compact variant="secondary" title="Change photo" icon="image-outline" onPress={pick} /> : null}
        <View style={styles.identity}><Urdu style={styles.name}>{editing ? authorNameUrdu || author.authorNameUrdu : author.authorNameUrdu}</Urdu><Urdu style={[styles.penLine, { color: palette.muted }]}>{editing ? penNameUrdu || author.penNameUrdu : author.penNameUrdu}</Urdu></View>
        {!editing ? <View style={[styles.stats, { borderColor: palette.border }]}><View style={styles.stat}><Text style={[styles.statNum, { color: palette.text }]}>{app.books.length}</Text><Label style={{ color: palette.muted }}>Collections</Label></View><View style={[styles.statDivider, { backgroundColor: palette.border }]} /><View style={styles.stat}><Text style={[styles.statNum, { color: palette.text }]}>{app.writings.length}</Text><Label style={{ color: palette.muted }}>Poems</Label></View></View> : null}
      </View>

      {editing ? <View style={[styles.form, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Field label="Author name" rtl style={{ fontFamily }} value={authorNameUrdu} onChangeText={setAuthorNameUrdu} />
        <Field label="Pen name" rtl style={{ fontFamily }} value={penNameUrdu} onChangeText={setPenNameUrdu} />
        <Field label="Introduction" rtl multiline style={[styles.multi, { fontFamily }]} value={introduction} onChangeText={setIntroduction} />
        <Field label="Biography" rtl multiline style={[styles.multi, { fontFamily }]} value={biography} onChangeText={setBiography} />
        <Button title="Save changes" icon="checkmark" onPress={save} />
      </View> : <View style={styles.sections}>
        {author.introduction ? <View style={[styles.section, { borderTopColor: palette.border }]}><Text style={[styles.sectionKicker, { color: palette.muted }]}>INTRODUCTION</Text><Urdu style={[styles.body, { color: palette.text }]}>{author.introduction}</Urdu></View> : null}
        {author.biography ? <View style={[styles.section, { borderTopColor: palette.border }]}><Text style={[styles.sectionKicker, { color: palette.muted }]}>BIOGRAPHY</Text><Urdu style={[styles.body, { color: palette.text }]}>{author.biography}</Urdu></View> : null}
      </View>}
    </ScrollView>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, root: { flex: 1 }, content: { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: 48, gap: spacing.xl },
  hero: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.sm, paddingHorizontal: spacing.md }, photoRing: { width: 118, height: 118, borderRadius: 59, borderWidth: 1, padding: 5, alignItems: 'center', justifyContent: 'center' }, photo: { width: 106, height: 106, borderRadius: 53, resizeMode: 'cover' }, identity: { width: '100%', alignItems: 'center', marginTop: 2 }, name: { width: '100%', fontSize: typography.urdu.title.fontSize, lineHeight: Math.max(typography.urdu.title.lineHeight, 52), fontWeight: '900', textAlign: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs }, penLine: { fontSize: typography.urdu.small.fontSize, lineHeight: Math.max(typography.urdu.small.lineHeight, 24), textAlign: 'center', paddingHorizontal: spacing.sm, paddingVertical: 2 },
  stats: { flexDirection: 'row', minWidth: 220, borderWidth: 1, borderRadius: radii.control, marginTop: spacing.sm, paddingVertical: spacing.sm }, stat: { flex: 1, alignItems: 'center' }, statNum: { fontSize: 18, lineHeight: 24, fontWeight: '800' }, statDivider: { width: StyleSheet.hairlineWidth },
  form: { borderWidth: 1, borderRadius: radii.card, padding: spacing.lg, gap: spacing.md }, multi: { minHeight: 132, textAlignVertical: 'top', paddingTop: 14, lineHeight: 34 }, sections: { gap: spacing.xl }, section: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.lg, gap: spacing.sm }, sectionKicker: { fontSize: 10, letterSpacing: 1.1, fontWeight: '800', textAlign: 'right' }, body: { lineHeight: 35, fontSize: 17, textAlign: 'right' }
});
