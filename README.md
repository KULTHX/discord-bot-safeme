# KULTHX SAFEME Discord Bot

بوت ديسكورد لحماية نصوص Roblox - تحويل من موقع KULTHX SAFEME إلى بوت ديسكورد

## المميزات

- 🔒 **حماية النصوص**: تشفير وحماية نصوص Roblox
- 🛡️ **أمان متقدم**: يسمح فقط لطلبات Roblox
- 🤖 **أوامر ديسكورد**: تفاعل سهل عبر slash commands
- 📊 **إحصائيات**: تتبع الاستخدام والوصولات
- ⚡ **سرعة**: استجابة فورية للأوامر
- 🌐 **خادم ويب**: API لتنفيذ النصوص من Roblox

## الأوامر المتاحة

### `/حماية`
حماية نص Roblox وإنشاء رابط آمن
```
/حماية النص:print("Hello World!")
```

### `/نصوصي`
عرض جميع النصوص المحمية الخاصة بك

### `/حذف`
حذف نص محمي
```
/حذف المعرف:abc123def456
```

### `/إحصائيات`
عرض إحصائيات البوت والاستخدام

### `/مساعدة`
عرض دليل الاستخدام

## التثبيت والتشغيل

### 1. تنزيل المشروع
```bash
git clone <repository-url>
cd discord-bot-safeme
```

### 2. تثبيت المكتبات
```bash
npm install
```

### 3. إعداد التوكن
إنشاء ملف `.env` وإضافة توكن البوت:
```env
DISCORD_TOKEN=your_discord_bot_token_here
PORT=3000
HOST=0.0.0.0
```

### 4. تشغيل البوت
```bash
npm start
```

## إنشاء بوت ديسكورد

### 1. إنشاء التطبيق
1. اذهب إلى [Discord Developer Portal](https://discord.com/developers/applications)
2. اضغط على "New Application"
3. أدخل اسم البوت

### 2. إنشاء البوت
1. اذهب إلى تبويب "Bot"
2. اضغط على "Add Bot"
3. انسخ التوكن

### 3. إعداد الصلاحيات
في تبويب "OAuth2" > "URL Generator":
- اختر "bot" و "applications.commands"
- اختر الصلاحيات المطلوبة:
  - Send Messages
  - Use Slash Commands
  - Embed Links

### 4. دعوة البوت
استخدم الرابط المُنشأ لدعوة البوت إلى الخادم

## الإعدادات

يمكن تخصيص الإعدادات في ملف `.env`:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here

# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Script Protection Configuration
MAX_SCRIPT_LENGTH=50000
MAX_SCRIPTS_PER_USER=50
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## الأمان

- **حماية من المتصفحات**: منع الوصول المباشر للنصوص
- **فلترة User-Agent**: السماح فقط لطلبات Roblox
- **Rate Limiting**: منع الإساءة في الاستخدام
- **تشفير البيانات**: حماية النصوص المخزنة

## API Endpoints

### `GET /script.lua?id=SCRIPT_ID`
استرجاع النص المحمي (يعمل فقط مع Roblox)

### `GET /`
معلومات الخادم والحالة

## استخدام النصوص في Roblox

بعد حماية النص، استخدم الكود التالي في Roblox:
```lua
loadstring(game:HttpGet("http://your-server:3000/script.lua?id=SCRIPT_ID"))()
```

## المشاكل الشائعة

### البوت لا يستجيب
- تأكد من صحة التوكن
- تأكد من أن البوت لديه الصلاحيات المطلوبة
- تحقق من سجل الأخطاء

### النص لا يعمل في Roblox
- تأكد من استخدام الرابط الصحيح
- تحقق من أن Roblox يسمح بالطلبات الخارجية
- تأكد من أن النص لا يحتوي على أخطاء

## الدعم

إذا واجهت أي مشاكل:
1. تحقق من سجل الأخطاء
2. راجع الأسئلة الشائعة
3. اتصل بفريق الدعم

## الرخصة

هذا المشروع مرخص تحت رخصة MIT

## المساهمة

المساهمات مرحب بها! يرجى:
1. عمل Fork للمشروع
2. إنشاء فرع للميزة الجديدة
3. إرسال Pull Request

---

**KULTHX SAFEME Discord Bot** - حماية متقدمة لنصوص Roblox عبر ديسكورد 🔒🤖

