import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../store/AppContext';
import { Button, Card, Urdu } from '../components/Ui';
import { getPalette, layout, spacing, typography } from '../theme/theme';

export function AdminDashboardScreen({ onAddBook, onAddWriting, onReaders, onProfile, onBackup, onPdf, onLibrary }: { onAddBook:()=>void; onAddWriting:()=>void; onReaders:()=>void; onProfile:()=>void; onBackup:()=>void; onPdf:()=>void; onLibrary:()=>void }) {
  const app = useApp();
  const palette = getPalette(app.readingTheme);
  const stats = useMemo(() => ({
    books: app.books.length,
    writings: app.writings.length,
    readers: app.readers.length,
    drafts: app.writings.filter(w => w.status === 'draft').length
  }), [app.books, app.writings, app.readers]);
  const recentDrafts = useMemo(() => app.writings.filter(w => w.status === 'draft').sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4), [app.writings]);

  return <ScrollView style={[styles.root, { backgroundColor: palette.bg }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.hero}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.eyebrow, { color: palette.muted }]}>AUTHOR STUDIO</Text>
        <Urdu style={styles.title}>Your writing workspace</Urdu>
        <Text style={[styles.subtitle, { color: palette.muted }]}>{app.author?.authorName || 'Author'} · manage poems, collections and readers</Text>
      </View>
      <View style={[styles.avatar, { backgroundColor: palette.accentSoft }]}><Ionicons name="create-outline" size={24} color={palette.accentStrong} /></View>
    </View>

    <View style={styles.actions}>
      <Button title="New poem" icon="add" onPress={onAddWriting} />
      <Button variant="secondary" title="New collection" icon="book-outline" onPress={onAddBook} />
    </View>

    <View style={[styles.stats, { borderColor: palette.border, backgroundColor: palette.surface }]}>
      <MiniStat value={stats.books} label="Collections" />
      <Divider />
      <MiniStat value={stats.writings} label="Poems" />
      <Divider />
      <MiniStat value={stats.drafts} label="Drafts" />
      <Divider />
      <MiniStat value={stats.readers} label="Readers" />
    </View>

    <View style={styles.sectionHeader}>
      <View><Urdu style={styles.sectionTitle}>Continue writing</Urdu><Text style={[styles.sectionSub, { color: palette.muted }]}>Your latest drafts</Text></View>
      <Pressable onPress={onLibrary} style={({ pressed }) => [styles.link, pressed && styles.pressed]}><Text style={[styles.linkText, { color: palette.accentStrong }]}>Library</Text><Ionicons name="arrow-forward" size={14} color={palette.accentStrong}/></Pressable>
    </View>

    {recentDrafts.length ? <View style={[styles.list, { borderColor: palette.border, backgroundColor: palette.surface }]}>{recentDrafts.map((draft, index) => {
      const book = app.books.find(b => b.id === draft.bookId);
      return <View key={draft.id} style={[styles.draftRow, index > 0 && { borderTopColor: palette.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
        <View style={[styles.draftIcon, { backgroundColor: palette.surface2 }]}><Ionicons name="document-text-outline" size={18} color={palette.accentStrong}/></View>
        <View style={styles.draftCopy}><Urdu numberOfLines={1} style={styles.draftTitle}>{draft.title}</Urdu><Text numberOfLines={1} style={[styles.draftMeta, { color: palette.muted }]}>{book?.title || 'Collection'} · Draft</Text></View>
      </View>;
    })}</View> : <Card style={styles.empty}><Ionicons name="sparkles-outline" size={22} color={palette.accentStrong}/><Urdu style={styles.emptyTitle}>No drafts waiting</Urdu><Text style={[styles.emptyText, { color: palette.muted }]}>Start a new poem when inspiration arrives.</Text></Card>}

    <View style={styles.sectionHeader}><View><Urdu style={styles.sectionTitle}>Studio tools</Urdu><Text style={[styles.sectionSub, { color: palette.muted }]}>Publishing and account tools</Text></View></View>
    <View style={styles.toolGrid}>
      <Tool icon="people-outline" title="Readers" onPress={onReaders}/>
      <Tool icon="person-circle-outline" title="Profile" onPress={onProfile}/>
      <Tool icon="print-outline" title="PDF Studio" onPress={onPdf}/>
      <Tool icon="archive-outline" title="Backup" onPress={onBackup}/>
    </View>
  </ScrollView>;
}

function MiniStat({ value, label }: { value:number; label:string }) { const palette = getPalette(useApp().readingTheme); return <View style={styles.miniStat}><Text style={[styles.statValue,{color:palette.text}]}>{value}</Text><Text style={[styles.statLabel,{color:palette.muted}]}>{label}</Text></View>; }
function Divider(){const palette=getPalette(useApp().readingTheme);return <View style={[styles.divider,{backgroundColor:palette.border}]}/>;}
function Tool({ icon, title, onPress }: { icon:keyof typeof Ionicons.glyphMap; title:string; onPress:()=>void }) { const palette=getPalette(useApp().readingTheme); return <Pressable onPress={onPress} style={({pressed})=>[styles.tool,{backgroundColor:palette.surface,borderColor:palette.border},pressed&&styles.pressed]}><View style={[styles.toolIcon,{backgroundColor:palette.accentSoft}]}><Ionicons name={icon} size={20} color={palette.accentStrong}/></View><Text style={[styles.toolTitle,{color:palette.text}]}>{title}</Text><Ionicons name="chevron-forward" size={16} color={palette.muted}/></Pressable>; }

const styles=StyleSheet.create({
  root:{flex:1}, content:{width:'100%',maxWidth:layout.contentMaxWidth,alignSelf:'center',padding:spacing.lg,paddingBottom:104,gap:spacing.xl},
  hero:{flexDirection:'row',alignItems:'center',gap:spacing.md,paddingTop:spacing.sm}, eyebrow:{fontSize:10,fontWeight:'700',letterSpacing:1.4}, title:{fontSize:26,lineHeight:48,fontWeight:'700'}, subtitle:{fontSize:12,lineHeight:18,marginTop:-4}, avatar:{width:54,height:54,borderRadius:18,alignItems:'center',justifyContent:'center'},
  actions:{flexDirection:'row',gap:spacing.sm,flexWrap:'wrap'}, stats:{borderWidth:1,borderRadius:16,minHeight:86,flexDirection:'row',alignItems:'center',paddingHorizontal:spacing.md}, miniStat:{flex:1,alignItems:'center',gap:2}, statValue:{fontSize:22,fontWeight:'800'}, statLabel:{fontSize:10}, divider:{width:StyleSheet.hairlineWidth,height:38},
  sectionHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-end',gap:spacing.md}, sectionTitle:{fontSize:typography.urdu.section.fontSize,lineHeight:typography.urdu.section.lineHeight,fontWeight:'700'}, sectionSub:{fontSize:11,marginTop:-5}, link:{flexDirection:'row',alignItems:'center',gap:4,minHeight:40,paddingHorizontal:4},linkText:{fontSize:12,fontWeight:'700'},
  list:{borderWidth:1,borderRadius:16,overflow:'hidden'}, draftRow:{minHeight:72,flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:14,paddingVertical:10}, draftIcon:{width:40,height:40,borderRadius:12,alignItems:'center',justifyContent:'center'},draftCopy:{flex:1,minWidth:0},draftTitle:{fontSize:15,lineHeight:31,fontWeight:'700'},draftMeta:{fontSize:10,marginTop:-3},
  empty:{alignItems:'center',gap:4,paddingVertical:26},emptyTitle:{fontSize:16,lineHeight:31,fontWeight:'700'},emptyText:{fontSize:11,textAlign:'center'},
  toolGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},tool:{flexBasis:'48%',flexGrow:1,minHeight:64,borderWidth:1,borderRadius:14,flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:12},toolIcon:{width:38,height:38,borderRadius:12,alignItems:'center',justifyContent:'center'},toolTitle:{flex:1,fontSize:12,fontWeight:'700'},pressed:{opacity:.72,transform:[{scale:.985}]}
});
