# 🌐 KULTHX SAFEME Discord Bot - واجهة الويب

## 📋 نظرة عامة

هذا المشروع يوفر **واجهة ويب سهلة الاستخدام** لتشغيل بوت ديسكورد KULTHX SAFEME بدون الحاجة لإدخال التوكن في ملفات الكود أو متغيرات البيئة. ببساطة، افتح الموقع، أدخل توكن البوت، واضغط تشغيل!

## ✨ المميزات الجديدة

### 🎯 واجهة ويب تفاعلية
- **إدخال آمن للتوكن**: حقل محمي لإدخال توكن بوت ديسكورد
- **تشغيل فوري**: البوت يبدأ العمل فور إدخال التوكن الصحيح
- **مراقبة الحالة**: عرض حالة البوت في الوقت الفعلي
- **تصميم عربي**: واجهة مصممة خصيصاً للمستخدمين العرب

### 🔧 سهولة الاستخدام
- **لا حاجة لملفات .env**: التوكن يُدخل مباشرة عبر الواجهة
- **لا حاجة لسطر الأوامر**: كل شيء يتم عبر المتصفح
- **تعليمات واضحة**: دليل مفصل للحصول على توكن البوت

### 🛡️ الأمان
- **التوكن لا يُحفظ في الملفات**: يبقى في الذاكرة فقط
- **تشفير النصوص**: نفس نظام الحماية المتقدم
- **Rate Limiting**: حماية من الإساءة والهجمات

## 🚀 كيفية الاستخدام

### 1️⃣ تشغيل الخادم
```bash
# الطريقة الأولى: تشغيل الخادم الويب مباشرة
npm run web

# الطريقة الثانية: استخدام سكريبت البدء المحسن
node web-start.js
```

### 2️⃣ فتح الواجهة
افتح المتصفح واذهب إلى:
```
http://localhost:3000
```

### 3️⃣ إدخال التوكن
1. احصل على توكن البوت من [Discord Developer Portal](https://discord.com/developers/applications)
2. الصق التوكن في الحقل المخصص
3. اضغط "تشغيل البوت"

### 4️⃣ مراقبة الحالة
- ستظهر حالة البوت (متصل/غير متصل)
- اسم البوت وعدد الخوادم
- رسائل النجاح أو الأخطاء

## 📁 هيكل المشروع الجديد

```
discord-bot-safeme/
├── web-interface/          # واجهة الويب
│   └── index.html         # الصفحة الرئيسية
├── web-server.js          # خادم الويب والـ API
├── web-start.js           # سكريبت بدء التشغيل المحسن
├── bot.js                 # البوت الأصلي (للاستخدام المباشر)
├── start.js               # سكريبت البدء التقليدي
├── setup.js               # إعداد التوكن التقليدي
└── data/                  # بيانات النصوص المحمية
```

## 🔌 API Endpoints

### `GET /`
- **الوصف**: الصفحة الرئيسية لواجهة الويب
- **الاستجابة**: ملف HTML

### `POST /api/bot/start`
- **الوصف**: تشغيل البوت بتوكن معين
- **المعاملات**: `{ "token": "your_bot_token" }`
- **الاستجابة**: `{ "success": true, "connected": true, "botName": "BotName#1234" }`

### `GET /api/bot/status`
- **الوصف**: الحصول على حالة البوت الحالية
- **الاستجابة**: `{ "connected": false, "botName": null, "serverCount": 0 }`

### `POST /api/bot/stop`
- **الوصف**: إيقاف البوت
- **الاستجابة**: `{ "success": true, "message": "Bot stopped" }`

### `GET /script.lua?id=<script_id>`
- **الوصف**: تنفيذ النص المحمي (للاستخدام من Roblox فقط)
- **المعاملات**: `id` - معرف النص
- **الاستجابة**: النص المفكوك التشفير

## 🎨 تخصيص الواجهة

### تغيير الألوان
عدّل متغيرات CSS في `web-interface/index.html`:
```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --success-color: #28a745;
    --error-color: #dc3545;
}
```

### إضافة لغات أخرى
أضف ترجمات في JavaScript:
```javascript
const translations = {
    ar: {
        title: "KULTHX SAFEME Discord Bot",
        tokenLabel: "توكن بوت ديسكورد"
    },
    en: {
        title: "KULTHX SAFEME Discord Bot",
        tokenLabel: "Discord Bot Token"
    }
};
```

## 🔧 إعدادات متقدمة

### متغيرات البيئة الاختيارية
```env
PORT=3000                    # منفذ الخادم
HOST=0.0.0.0                # عنوان الاستماع
BASE_URL=http://localhost:3000  # الرابط الأساسي للنصوص
ENCRYPTION_KEY=your-secret-key  # مفتاح التشفير
RATE_LIMIT_WINDOW_MS=900000     # نافزة Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100     # الحد الأقصى للطلبات
```

### تشغيل في الإنتاج
```bash
# استخدام PM2
pm2 start web-server.js --name "kulthx-safeme-web"

# أو استخدام nohup
nohup npm run web > server.log 2>&1 &
```

## 🛠️ استكشاف الأخطاء

### ❌ "فشل في تشغيل البوت: An invalid token was provided"
**الحل:** تأكد من صحة توكن البوت من Discord Developer Portal

### ❌ "خطأ في الاتصال بالخادم"
**الحل:** تأكد من تشغيل الخادم على المنفذ الصحيح

### ❌ "البوت لا يستجيب للأوامر"
**الحل:** تأكد من أن البوت لديه الصلاحيات المطلوبة في الخادم

### ❌ "Access denied: This endpoint is only accessible from Roblox"
**الحل:** هذا طبيعي - النصوص تعمل فقط من داخل Roblox

## 🔒 الأمان والخصوصية

### حماية التوكن
- التوكن لا يُحفظ في أي ملف
- يبقى في ذاكرة الخادم فقط
- يُحذف عند إيقاف الخادم

### حماية النصوص
- تشفير AES-256-CBC
- مفاتيح تشفير قابلة للتخصيص
- وصول محدود من Roblox فقط

### Rate Limiting
- 100 طلب كل 15 دقيقة لكل IP
- حماية من هجمات DDoS
- تسجيل محاولات الإساءة

## 📊 مراقبة الأداء

### إحصائيات الاستخدام
- عدد النصوص المحمية
- عدد المستخدمين النشطين
- مرات الوصول للنصوص
- حالة البوت والخوادم

### السجلات
```bash
# عرض سجلات الخادم
tail -f server.log

# عرض سجلات PM2
pm2 logs kulthx-safeme-web
```

## 🚀 النشر

### Heroku
```bash
# إضافة متغيرات البيئة
heroku config:set NODE_ENV=production
heroku config:set PORT=3000

# نشر الكود
git push heroku main
```

### Railway
1. ربط مستودع GitHub
2. إضافة متغيرات البيئة
3. النشر التلقائي

### VPS
```bash
# استنساخ المشروع
git clone https://github.com/KULTHX/discord-bot-safeme.git
cd discord-bot-safeme

# تثبيت المكتبات
npm install

# تشغيل الخادم
npm run web
```

## 🎉 الخلاصة

الآن لديك **واجهة ويب كاملة** لإدارة بوت ديسكورد KULTHX SAFEME! لا حاجة لتعديل الملفات أو استخدام سطر الأوامر - كل شيء يتم عبر المتصفح بسهولة تامة.

**استمتع بتجربة استخدام محسنة وآمنة! 🔒✨**

---

*تم تطوير هذه الواجهة لتسهيل استخدام بوت KULTHX SAFEME وجعله متاحاً للجميع*

