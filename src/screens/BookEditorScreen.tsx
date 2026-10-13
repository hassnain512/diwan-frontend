import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Book, BookStatus } from '../types';
import { useApp } from '../store/AppContext';
import { BookCover } from '../components/BookCover';
import { Button, Field, Urdu } from '../components/Ui';
import { useDialog } from '../components/Dialog';
import { fontFamily, getPalette, layout, spacing } from '../theme/theme';

const themes: NonNullable<Book['coverTheme']>[] = ['leather-gold','maroon-gold','emerald-gilded','sapphire-silver','noir-cream','terracotta-copper'];
const ornaments: NonNullable<Book['coverOrnament']>[] = ['floral','arabesque','calligraphy','geometric'];
const themeNames: Record<NonNullable<Book['coverTheme']>,string> = { 'leather-gold':'Leather','maroon-gold':'Maroon','emerald-gilded':'Emerald','sapphire-silver':'Sapphire','noir-cream':'Noir','terracotta-copper':'Terracotta' };

export function BookEditorScreen({ book, onClose }: { book?: Book; onClose: () => void }) {
  const app=useApp(); const dialog=useDialog(); const palette=getPalette(app.readingTheme);
  const [title,setTitle]=useState(book?.title||''); const [status,setStatus]=useState<BookStatus>(book?.status||'draft');
  const [coverType,setCoverType]=useState<Book['coverType']>(book?.coverType||'generated'); const [coverUrl,setCoverUrl]=useState(book?.coverUrl||'');
  const [theme,setTheme]=useState<NonNullable<Book['coverTheme']>>(book?.coverTheme||'leather-gold'); const [ornament,setOrnament]=useState<NonNullable<Book['coverOrnament']>>(book?.coverOrnament||'arabesque'); const [saving,setSaving]=useState(false);
  const preview:Book={id:book?.id||'preview',title:title||'نئی کتاب',coverType,coverUrl,coverTheme:theme,coverOrnament:ornament,status,orderIndex:book?.orderIndex||0,createdAt:book?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
  const pick=async()=>{const res=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,aspect:[2,3],quality:.9});if(!res.canceled){setCoverUrl(res.assets[0].uri);setCoverType('custom');}};
  const save=async()=>{if(!title.trim()){await dialog.alert({title:'Book title',message:'Enter a title.',tone:'warning'});return;}setSaving(true);try{await app.saveBook({...book,title:title.trim(),status,coverType,coverUrl,coverTheme:theme,coverOrnament:ornament});onClose();}catch(e:any){await dialog.alert({title:'Unable to save',message:e.message,tone:'danger'});}finally{setSaving(false);}};
  const removeBook=async()=>{if(!book)return;const confirmed=await dialog.confirm({title:'Delete collection?',message:`“${book.title}” and all of its poems will be permanently deleted.`,confirmLabel:'Delete',destructive:true,tone:'danger',icon:'trash-outline',requiredText:book.title});if(!confirmed)return;await app.removeBook(book.id);onClose();};

  return <ScrollView style={[styles.root,{backgroundColor:palette.bg}]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <View style={[styles.header,{borderBottomColor:palette.border}]}><Button compact variant="ghost" title="Cancel" onPress={onClose}/><Urdu style={styles.heading}>{book?'Edit collection':'New collection'}</Urdu><Button compact title="Save" onPress={save} loading={saving}/></View>

    <View style={styles.previewArea}>
      <View style={styles.coverWrap}><BookCover book={preview} authorName={app.author?.authorNameUrdu}/></View>
      <Text style={[styles.previewLabel,{color:palette.muted}]}>LIVE COVER PREVIEW</Text>
    </View>

    <View style={styles.form}>
      <Field label="Book title" rtl style={{fontFamily}} value={title} onChangeText={setTitle} placeholder="Enter title"/>
      <SectionLabel title="Publication"/><Segment options={[['draft','Draft'],['coming_soon','Coming soon'],['published','Published']]} value={status} onChange={v=>setStatus(v as BookStatus)}/>
      <SectionLabel title="Cover source"/><Segment options={[['generated','Designed cover'],['custom','Custom image']]} value={coverType} onChange={v=>setCoverType(v as Book['coverType'])}/>

      {coverType==='custom'?<View style={styles.customBlock}><Button variant="secondary" icon="image-outline" title={coverUrl?'Choose another image':'Choose image'} onPress={pick}/>{coverUrl?<Image source={{uri:coverUrl}} style={[styles.image,{borderColor:palette.border}]}/>:null}</View>:<>
        <SectionLabel title="Cover style" subtitle="Choose a visual direction"/>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.themeRail}>{themes.map(t=>{const sample:Book={...preview,coverType:'generated',coverTheme:t};return <Pressable key={t} onPress={()=>setTheme(t)} style={({pressed})=>[styles.themeOption,theme===t&&{borderColor:palette.accentStrong,backgroundColor:palette.accentSoft},! (theme===t)&&{borderColor:palette.border,backgroundColor:palette.surface},pressed&&styles.pressed]}><View style={styles.thumb}><BookCover book={sample} authorName={app.author?.authorNameUrdu} compact/></View><Text style={[styles.themeName,{color:theme===t?palette.accentStrong:palette.text}]}>{themeNames[t]}</Text></Pressable>;})}</ScrollView>

        <SectionLabel title="Ornament" subtitle="Decoration used on the generated cover"/>
        <View style={styles.ornaments}>{ornaments.map(o=><Pressable key={o} onPress={()=>setOrnament(o)} style={({pressed})=>[styles.ornament,{borderColor:ornament===o?palette.accentStrong:palette.border,backgroundColor:ornament===o?palette.accentSoft:palette.surface},pressed&&styles.pressed]}><Text style={[styles.ornamentText,{color:ornament===o?palette.accentStrong:palette.text}]}>{o[0].toUpperCase()+o.slice(1)}</Text>{ornament===o?<IoniconsCheck/>:null}</Pressable>)}</View>
      </>}

      {book?<View style={[styles.dangerZone,{borderTopColor:palette.border}]}><Text style={[styles.dangerTitle,{color:palette.danger}]}>Danger zone</Text><Button variant="danger" icon="trash-outline" title="Delete collection" onPress={()=>void removeBook()}/></View>:null}
    </View>
  </ScrollView>;
}

function IoniconsCheck(){return <Text style={{fontSize:12}}>✓</Text>}
function SectionLabel({title,subtitle}:{title:string;subtitle?:string}){const palette=getPalette(useApp().readingTheme);return <View><Text style={[styles.label,{color:palette.text}]}>{title}</Text>{subtitle?<Text style={[styles.labelSub,{color:palette.muted}]}>{subtitle}</Text>:null}</View>}
function Segment({options,value,onChange}:{options:[string,string][];value:string;onChange:(v:string)=>void}){const palette=getPalette(useApp().readingTheme);return <View style={[styles.segment,{borderColor:palette.border,backgroundColor:palette.surface2}]}>{options.map(([v,l])=><Pressable key={v} onPress={()=>onChange(v)} style={({pressed})=>[styles.seg,value===v&&{backgroundColor:palette.accent},pressed&&styles.pressed]}><Text style={[styles.segText,{color:value===v?(palette.dark?'#11120F':'#FFFCF7'):palette.muted}]}>{l}</Text></Pressable>)}</View>}

const styles=StyleSheet.create({root:{flex:1},content:{width:'100%',maxWidth:layout.contentMaxWidth,alignSelf:'center',padding:spacing.lg,paddingBottom:48},header:{minHeight:64,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8,borderBottomWidth:StyleSheet.hairlineWidth},heading:{fontSize:19,lineHeight:36,fontWeight:'700',textAlign:'center',flex:1},previewArea:{alignItems:'center',paddingVertical:24},coverWrap:{width:168},previewLabel:{fontSize:9,fontWeight:'700',letterSpacing:1.2,marginTop:12},form:{gap:14},label:{fontSize:13,fontWeight:'800'},labelSub:{fontSize:10,lineHeight:16,marginTop:2},segment:{flexDirection:'row',gap:4,padding:4,borderWidth:1,borderRadius:14},seg:{flex:1,minHeight:44,borderRadius:10,alignItems:'center',justifyContent:'center',paddingHorizontal:6},segText:{fontSize:11,fontWeight:'700',textAlign:'center'},themeRail:{gap:9,paddingVertical:2},themeOption:{width:106,borderWidth:1,borderRadius:14,padding:8,alignItems:'center',gap:7},thumb:{width:78},themeName:{fontSize:10,fontWeight:'700'},ornaments:{flexDirection:'row',flexWrap:'wrap',gap:8},ornament:{minHeight:44,borderWidth:1,borderRadius:12,paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:7},ornamentText:{fontSize:11,fontWeight:'700'},customBlock:{gap:12},image:{width:'100%',height:220,borderRadius:16,borderWidth:1},dangerZone:{borderTopWidth:StyleSheet.hairlineWidth,paddingTop:18,marginTop:8,gap:10},dangerTitle:{fontSize:11,fontWeight:'800'},pressed:{opacity:.72,transform:[{scale:.985}]}});
