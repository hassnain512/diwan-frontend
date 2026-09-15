import { AuthorProfile, Book, ReaderAccount, Writing } from './types';

const now = Date.now();
const daysAgo = (days: number) => new Date(now - days * 86400000).toISOString();

export const seedAuthor: AuthorProfile = {
  authorName: 'Hassnain Raza Maitla',
  authorNameUrdu: 'حسنین رضا میتلا',
  penNameUrdu: 'رضاؔ',
  email: 'hassnainrazamaitla@gmail.com',
  biography: 'حسنین رضا میتلا اردو شاعری اور ادب سے گہرا تعلق رکھنے والے شاعر ہیں۔ یہ نجی کتب خانہ ان کے ذاتی مجموعۂ کلام کے لیے بنایا گیا ہے۔',
  introduction: 'دیوان ایک نجی ڈیجیٹل کتب خانہ ہے جہاں منتخب قارئین مصنف کا شائع شدہ کلام مطالعہ کر سکتے ہیں۔',
  profileImage: '',
  updatedAt: daysAgo(1)
};

export const seedBooks: Book[] = [
  { id: 'book-1', title: 'سفرِ دل', coverType: 'generated', coverTheme: 'leather-gold', coverOrnament: 'arabesque', status: 'published', orderIndex: 0, createdAt: daysAgo(30), updatedAt: daysAgo(2) },
  { id: 'book-2', title: 'آئینۂ عشق', coverType: 'generated', coverTheme: 'maroon-gold', coverOrnament: 'floral', status: 'published', orderIndex: 1, createdAt: daysAgo(20), updatedAt: daysAgo(4) },
  { id: 'book-3', title: 'شبِ تنہائی', coverType: 'generated', coverTheme: 'emerald-gilded', coverOrnament: 'calligraphy', status: 'published', orderIndex: 2, createdAt: daysAgo(12), updatedAt: daysAgo(6) },
  { id: 'book-4', title: 'دشتِ آرزو', coverType: 'generated', coverTheme: 'sapphire-silver', coverOrnament: 'geometric', status: 'coming_soon', orderIndex: 3, createdAt: daysAgo(5), updatedAt: daysAgo(5) },
  { id: 'book-5', title: 'بیاضِ دل (مسودہ)', coverType: 'generated', coverTheme: 'noir-cream', coverOrnament: 'floral', status: 'draft', orderIndex: 4, createdAt: daysAgo(1), updatedAt: daysAgo(1) }
];

export const seedWritings: Writing[] = [
  { id: 'w-101', bookId: 'book-1', title: 'پہلا سفر', status: 'published', orderIndex: 0, content: `<div dir="rtl"><p>رات کی خاموشی میں دل نے بہت کچھ کہا<br />ایک تری یاد تھی اک درد تھا جو ساتھ رہا</p><div class="poetry-divider">❦ ❦ ❦</div><p>ہم تو سمجھے تھے کہ منزل ہی مقدر ہوگی<br />راستہ خود ہی مسافر کی طرح بھٹکتا رہا</p><div class="poetry-divider">❦ ❦ ❦</div><p>تجھ سے بچھڑے تو معلوم ہوا دنیا کیا ہے<br />جیسے ویرانے میں اک شخص اکیلا ہی رہا</p><div class="poetry-divider">❦ ❦ ❦</div><p>اب رضاؔ کس سے کہیں داستاں اپنی جا کر<br />جو بھی تھا پاس وہ لمحہ بھی گریزاں ہی رہا</p></div>`, createdAt: daysAgo(28), updatedAt: daysAgo(28) },
  { id: 'w-102', bookId: 'book-1', title: 'یادوں کے چراغ', status: 'published', orderIndex: 1, content: `<div dir="rtl"><p>جلتے رہے چراغ تو آنکھوں میں خواب تھے<br />جب بجھ گئے دیے تو سبھی بے نقاب تھے</p><div class="poetry-divider">❦ ❦ ❦</div><p>کتنے ہی فاصلے تھے ہمارے وجود میں<br />گو ہم قریب تر تھے مگر اجتناب تھے</p><div class="poetry-divider">❦ ❦ ❦</div><p>ہر لفظِ التجا پہ ملا خامشی کا زہر<br />اور ان کے فیصلے بھی بڑے لاجواب تھے</p></div>`, createdAt: daysAgo(25), updatedAt: daysAgo(25) },
  { id: 'w-103', bookId: 'book-1', title: 'تنہائی کا دکھ', status: 'published', orderIndex: 2, content: `<div dir="rtl"><p>یہ تنہائی بھی اک نعمت ہے جو سمجھے اسے<br />اپنے ہی دھیان میں دنیا کو بھلا دیتا ہے</p><div class="poetry-divider">❦ ❦ ❦</div><p>نہ گلہ کوئی زمانے سے نہ شکوہ لب پر<br />سب خساروں کو رضاؔ بزم بنا دیتا ہے</p></div>`, createdAt: daysAgo(22), updatedAt: daysAgo(22) },
  { id: 'w-104', bookId: 'book-1', title: 'امیدِ سحر', status: 'published', orderIndex: 3, content: `<div dir="rtl"><p>شام ڈھلتے ہی کسی یاد نے دستک دی ہے<br />جیسے صحرا میں کسی بوند نے بارش دی ہے</p><div class="poetry-divider">❦ ❦ ❦</div><p>صبح آئے گی اندھیروں کو مٹانے کے لیے<br />ہم نے خوں سے ترے آنگن میں ضیا بخشی ہے</p></div>`, createdAt: daysAgo(20), updatedAt: daysAgo(20) },
  { id: 'w-201', bookId: 'book-2', title: 'عکسِ رخسار', status: 'published', orderIndex: 0, content: `<div dir="rtl"><p>آئینے میں تری صورت جو نظر آئی ہے<br />کتنی صدیوں کے تقاضوں کی پزیرائی ہے</p><div class="poetry-divider">❦ ❦ ❦</div><p>ہم نے چاہا تھا کہ دیکھیں ترا جلوہ لیکن<br />نظر اٹھتے ہی حیا درمیاں در آئی ہے</p></div>`, createdAt: daysAgo(18), updatedAt: daysAgo(18) },
  { id: 'w-202', bookId: 'book-2', title: 'دشتِ وفا', status: 'published', orderIndex: 1, content: `<div dir="rtl"><p>پاؤں چھلنی ہیں مگر سفر تو جاری ہے<br />دشتِ وحشت میں بھی اک آس تمہاری ہے</p><div class="poetry-divider">❦ ❦ ❦</div><p>اہلِ دل جان سے گزرے تو کھلا بھیدِ حیات<br />عشق کا کھیل ہی دراصل خودداری ہے</p></div>`, createdAt: daysAgo(15), updatedAt: daysAgo(15) },
  { id: 'w-301', bookId: 'book-3', title: 'اداس راتیں', status: 'published', orderIndex: 0, content: `<div dir="rtl"><p>اداس راتوں کا ماتم سنبھال رکھا ہے<br />ترے فراق کا موسم سنبھال رکھا ہے</p><div class="poetry-divider">❦ ❦ ❦</div><p>ہزار بار بکھر کر بھی مسکرائے ہیں<br />ہم نے تو حوصلہ ہر دم سنبھال رکھا ہے</p></div>`, createdAt: daysAgo(9), updatedAt: daysAgo(9) },
  { id: 'w-501', bookId: 'book-5', title: 'نو تصنیف شعر (مسودہ)', status: 'draft', orderIndex: 0, content: `<div dir="rtl"><p>ابھی تو حرفِ آرزو کو صورتِ بیاں نہ ملی<br />ابھی تو دل کے مضطر کو کوئی زباں نہ ملی</p></div>`, createdAt: daysAgo(1), updatedAt: daysAgo(1) }
];

export const seedReaders: ReaderAccount[] = [
  { id: 'reader-1', fullName: 'احمد رضا', username: 'ahmed', password: 'urdu123', status: 'active', deviceId: null, deviceName: null, lastLogin: null, createdAt: daysAgo(15) },
  { id: 'reader-2', fullName: 'فاطمہ زہرا', username: 'fatima', password: 'shair786', status: 'active', deviceId: null, deviceName: null, lastLogin: null, createdAt: daysAgo(10) },
  { id: 'reader-3', fullName: 'محمد عثمان', username: 'usman', password: 'adab456', status: 'inactive', deviceId: null, deviceName: null, lastLogin: null, createdAt: daysAgo(5) }
];
