import readline from 'readline';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupBot() {
  console.log('🤖 مرحباً بك في إعداد KULTHX SAFEME Discord Bot');
  console.log('=' .repeat(50));
  
  try {
    // Check if .env already exists
    const envPath = path.join(__dirname, '.env');
    const envExists = await fs.pathExists(envPath);
    
    if (envExists) {
      console.log('⚠️  ملف .env موجود بالفعل');
      const overwrite = await question('هل تريد إعادة الإعداد؟ (y/n): ');
      if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
        console.log('✅ تم إلغاء الإعداد');
        rl.close();
        return;
      }
    }
    
    console.log('\n📝 يرجى إدخال المعلومات التالية:');
    console.log('');
    
    // Discord Token
    console.log('🔑 توكن ديسكورد:');
    console.log('   - اذهب إلى https://discord.com/developers/applications');
    console.log('   - أنشئ تطبيق جديد أو اختر موجود');
    console.log('   - اذهب إلى تبويب "Bot"');
    console.log('   - انسخ التوكن');
    console.log('');
    
    const discordToken = await question('أدخل توكن ديسكورد: ');
    
    if (!discordToken || discordToken.trim().length === 0) {
      console.log('❌ توكن ديسكورد مطلوب!');
      rl.close();
      return;
    }
    
    // Server Configuration
    console.log('\n🌐 إعدادات الخادم:');
    const port = await question('المنفذ (افتراضي: 3000): ') || '3000';
    const host = await question('العنوان (افتراضي: 0.0.0.0): ') || '0.0.0.0';
    const nodeEnv = await question('البيئة (development/production) (افتراضي: development): ') || 'development';
    
    // Script Protection Configuration
    console.log('\n🔒 إعدادات حماية النصوص:');
    const maxScriptLength = await question('الحد الأقصى لطول النص (افتراضي: 50000): ') || '50000';
    const maxScriptsPerUser = await question('الحد الأقصى للنصوص لكل مستخدم (افتراضي: 50): ') || '50';
    const rateLimitWindow = await question('نافزة Rate Limiting بالدقائق (افتراضي: 15): ') || '15';
    const rateLimitMax = await question('الحد الأقصى للطلبات في النافزة (افتراضي: 100): ') || '100';
    
    // Create .env content
    const envContent = `# Discord Bot Configuration
DISCORD_TOKEN=${discordToken.trim()}

# Server Configuration
PORT=${port}
HOST=${host}
NODE_ENV=${nodeEnv}

# Script Protection Configuration
MAX_SCRIPT_LENGTH=${maxScriptLength}
MAX_SCRIPTS_PER_USER=${maxScriptsPerUser}
RATE_LIMIT_WINDOW_MS=${parseInt(rateLimitWindow) * 60000}
RATE_LIMIT_MAX_REQUESTS=${rateLimitMax}

# Security
ENCRYPTION_KEY=${generateRandomKey()}

# Generated on ${new Date().toISOString()}
`;

    // Write .env file
    await fs.writeFile(envPath, envContent);
    
    console.log('\n✅ تم إنشاء ملف .env بنجاح!');
    console.log('');
    console.log('🚀 لتشغيل البوت:');
    console.log('   npm start');
    console.log('');
    console.log('📖 لعرض المساعدة:');
    console.log('   npm run help');
    console.log('');
    console.log('🔗 دعوة البوت إلى الخادم:');
    console.log('   1. اذهب إلى https://discord.com/developers/applications');
    console.log('   2. اختر تطبيقك');
    console.log('   3. اذهب إلى OAuth2 > URL Generator');
    console.log('   4. اختر "bot" و "applications.commands"');
    console.log('   5. اختر الصلاحيات المطلوبة');
    console.log('   6. استخدم الرابط المُنشأ');
    console.log('');
    console.log('⚠️  ملاحظة مهمة:');
    console.log('   - لا تشارك توكن البوت مع أحد');
    console.log('   - احتفظ بنسخة احتياطية من ملف .env');
    console.log('   - تأكد من أن البوت لديه الصلاحيات المطلوبة');
    
  } catch (error) {
    console.error('❌ خطأ في الإعداد:', error.message);
  } finally {
    rl.close();
  }
}

function generateRandomKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Handle Ctrl+C
rl.on('SIGINT', () => {
  console.log('\n\n🛑 تم إلغاء الإعداد');
  process.exit(0);
});

// Start setup
setupBot();

