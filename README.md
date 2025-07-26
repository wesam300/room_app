# Fruity Fortune - تطبيق الغرف التفاعلية

تطبيق ويب تفاعلي للغرف الصوتية مع لعبة الفواكه، مبني بـ Next.js و Firebase.

## ✨ المميزات

- **غرف تفاعلية**: إنشاء والانضمام للغرف الصوتية
- **لعبة الفواكه**: لعبة رهان تفاعلية مع نظام مكافآت
- **نظام العملات**: عملات ذهبية وفضية قابلة للتحويل
- **مزامنة فورية**: حفظ البيانات في Firebase Firestore
- **واجهة مستخدم حديثة**: تصميم جميل ومتجاوب

## 🚀 التقنيات المستخدمة

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Hosting**: Firebase Hosting
- **Animations**: Framer Motion

## 📦 التثبيت والتشغيل

### المتطلبات الأساسية
- Node.js 18+
- npm أو yarn
- حساب Firebase

### خطوات التثبيت

1. **استنساخ المشروع**
```bash
git clone <repository-url>
cd rooms_app-main
```

2. **تثبيت التبعيات**
```bash
npm install
```

3. **إعداد Firebase**
   - إنشاء مشروع Firebase جديد
   - تفعيل Firestore Database
   - إضافة تطبيق ويب
   - نسخ مفاتيح التكوين

4. **إعداد متغيرات البيئة**
إنشاء ملف `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

5. **تشغيل المشروع**
```bash
# وضع التطوير
npm run dev

# بناء المشروع
npm run build

# نشر على Firebase
npm run deploy
```

## 🔥 إعداد Firebase

### 1. إنشاء مشروع Firebase
- اذهب إلى [Firebase Console](https://console.firebase.google.com)
- أنشئ مشروع جديد
- اختر "Add app" > "Web"

### 2. تفعيل Firestore
- اذهب إلى Firestore Database
- اختر "Create database"
- اختر "Start in test mode"

### 3. إعداد Firebase CLI
```bash
npm install -g firebase-tools
firebase login
firebase init
```

### 4. نشر المشروع
```bash
npm run build
firebase deploy
```

## 📁 هيكل المشروع

```
src/
├── app/                 # صفحات Next.js
├── components/          # مكونات React
│   ├── ui/             # مكونات UI الأساسية
│   ├── FruityFortuneGame.tsx
│   └── RoomMic.tsx
├── hooks/              # React Hooks
│   ├── useFirebase.ts  # Firebase hooks
│   └── use-toast.ts
├── lib/                # مكتبات وخدمات
│   ├── firebase.ts     # إعداد Firebase
│   ├── firebaseServices.ts  # خدمات Firebase
│   └── utils.ts
└── public/             # الملفات الثابتة
```

## 🔧 الخدمات المتاحة

### Firebase Services
- **User Management**: إدارة المستخدمين والملفات الشخصية
- **Room Management**: إنشاء وإدارة الغرف
- **Chat System**: نظام المحادثات الفوري
- **Game History**: حفظ تاريخ اللعب
- **Real-time Sync**: مزامنة فورية للبيانات

### الميزات الرئيسية
- ✅ حفظ البيانات في Firebase Firestore
- ✅ مزامنة فورية بين المستخدمين
- ✅ نظام رهان تفاعلي
- ✅ إدارة العملات والرصيد
- ✅ واجهة مستخدم متجاوبة
- ✅ نشر على Firebase Hosting

## 🌐 الروابط

- **الموقع**: https://fruity-fortune-x5pb6.web.app
- **لوحة التحكم**: https://console.firebase.google.com/project/fruity-fortune-x5pb6

## 📝 الأوامر المتاحة

```bash
# التطوير
npm run dev              # تشغيل خادم التطوير
npm run build            # بناء المشروع
npm run start            # تشغيل خادم الإنتاج

# Firebase
firebase login           # تسجيل الدخول
firebase deploy          # نشر المشروع
firebase serve           # تشغيل محلي

# النشر
npm run deploy           # بناء ونشر
```

## 🤝 المساهمة

1. Fork المشروع
2. أنشئ branch جديد (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push إلى Branch (`git push origin feature/AmazingFeature`)
5. افتح Pull Request

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT - انظر ملف [LICENSE](LICENSE) للتفاصيل.

## 📞 الدعم

للدعم والاستفسارات، يرجى التواصل عبر:
- إنشاء Issue في GitHub
- البريد الإلكتروني: [your-email@example.com]

---

**تم التطوير بـ ❤️ باستخدام Next.js و Firebase**
