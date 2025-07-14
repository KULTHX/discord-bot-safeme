# دليل النشر - KULTHX SAFEME Discord Bot

## نشر البوت على خدمات مختلفة

### 1. النشر على Heroku

#### الخطوات:
1. إنشاء حساب على [Heroku](https://heroku.com)
2. تثبيت Heroku CLI
3. تسجيل الدخول: `heroku login`
4. إنشاء تطبيق: `heroku create your-bot-name`
5. إضافة متغيرات البيئة:
   ```bash
   heroku config:set DISCORD_TOKEN=your_token_here
   heroku config:set PORT=3000
   heroku config:set HOST=0.0.0.0
   heroku config:set NODE_ENV=production
   ```
6. نشر الكود: `git push heroku main`

#### ملف Procfile:
```
web: npm start
```

### 2. النشر على Railway

#### الخطوات:
1. إنشاء حساب على [Railway](https://railway.app)
2. ربط مستودع GitHub
3. إضافة متغيرات البيئة في لوحة التحكم
4. النشر التلقائي

### 3. النشر على Render

#### الخطوات:
1. إنشاء حساب على [Render](https://render.com)
2. إنشاء Web Service جديد
3. ربط مستودع GitHub
4. إعداد متغيرات البيئة
5. النشر

### 4. النشر على VPS

#### متطلبات:
- خادم Linux (Ubuntu/CentOS)
- Node.js 18+
- PM2 للإدارة

#### الخطوات:
```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# تثبيت PM2
sudo npm install -g pm2

# استنساخ المشروع
git clone your-repository-url
cd discord-bot-safeme

# تثبيت المكتبات
npm install

# إعداد البوت
npm run setup

# تشغيل البوت مع PM2
pm2 start bot.js --name "discord-bot-safeme"
pm2 startup
pm2 save
```

## إعداد قاعدة البيانات

### استخدام ملفات JSON (افتراضي)
البوت يستخدم ملفات JSON محلية بشكل افتراضي. مناسب للاستخدام الصغير.

### استخدام MongoDB
لإضافة دعم MongoDB:

1. تثبيت mongoose:
   ```bash
   npm install mongoose
   ```

2. إضافة متغير البيئة:
   ```env
   MONGODB_URI=mongodb://localhost:27017/safeme
   ```

3. تعديل الكود لاستخدام MongoDB

### استخدام PostgreSQL
لإضافة دعم PostgreSQL:

1. تثبيت pg:
   ```bash
   npm install pg
   ```

2. إضافة متغير البيئة:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/safeme
   ```

## الأمان في الإنتاج

### 1. متغيرات البيئة
- لا تضع التوكنات في الكود
- استخدم خدمات إدارة الأسرار
- قم بتدوير التوكنات بانتظام

### 2. Rate Limiting
```env
RATE_LIMIT_WINDOW_MS=900000  # 15 دقيقة
RATE_LIMIT_MAX_REQUESTS=100  # 100 طلب
```

### 3. HTTPS
- استخدم HTTPS دائماً في الإنتاج
- احصل على شهادة SSL مجانية من Let's Encrypt

### 4. Firewall
- اسمح فقط بالمنافذ المطلوبة
- استخدم fail2ban لمنع الهجمات

## المراقبة والسجلات

### 1. PM2 Monitoring
```bash
pm2 monit
pm2 logs discord-bot-safeme
```

### 2. إعداد التنبيهات
```bash
# تنبيه عند توقف البوت
pm2 install pm2-auto-pull
pm2 install pm2-server-monit
```

### 3. النسخ الاحتياطية
```bash
# نسخ احتياطية يومية للبيانات
crontab -e
# إضافة: 0 2 * * * /path/to/backup-script.sh
```

## التحديث والصيانة

### 1. تحديث البوت
```bash
git pull origin main
npm install
pm2 restart discord-bot-safeme
```

### 2. تحديث المكتبات
```bash
npm update
npm audit fix
```

### 3. مراقبة الأداء
- استخدم `htop` لمراقبة الموارد
- راقب استخدام الذاكرة والمعالج
- تحقق من سجلات الأخطاء بانتظام

## استكشاف الأخطاء

### مشاكل شائعة:

#### البوت لا يبدأ
```bash
# تحقق من السجلات
pm2 logs discord-bot-safeme

# تحقق من متغيرات البيئة
pm2 env discord-bot-safeme
```

#### مشاكل الذاكرة
```bash
# زيادة حد الذاكرة
pm2 start bot.js --max-memory-restart 500M
```

#### مشاكل الشبكة
```bash
# تحقق من المنافذ
netstat -tulpn | grep :3000

# تحقق من الجدار الناري
sudo ufw status
```

## النسخ الاحتياطي والاستعادة

### نسخ احتياطي للبيانات
```bash
#!/bin/bash
# backup-script.sh
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf "/backup/safeme_$DATE.tar.gz" /path/to/discord-bot-safeme/data/
```

### استعادة البيانات
```bash
tar -xzf safeme_backup.tar.gz -C /path/to/discord-bot-safeme/
pm2 restart discord-bot-safeme
```

## الأداء والتحسين

### 1. تحسين Node.js
```bash
# استخدام Node.js 18+ للأداء الأفضل
node --version

# تحسين الذاكرة
export NODE_OPTIONS="--max-old-space-size=512"
```

### 2. تحسين قاعدة البيانات
- استخدم فهارس مناسبة
- قم بتنظيف البيانات القديمة
- راقب أداء الاستعلامات

### 3. CDN للملفات الثابتة
- استخدم CloudFlare أو AWS CloudFront
- ضغط الملفات الثابتة
- تحسين الصور

---

**ملاحظة:** تأكد من اختبار جميع التغييرات في بيئة التطوير قبل النشر في الإنتاج.

