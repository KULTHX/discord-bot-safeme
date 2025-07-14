import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function startBot() {
  console.log('🚀 بدء تشغيل KULTHX SAFEME Discord Bot...');
  console.log('=' .repeat(50));
  
  try {
    // Check if .env exists
    const envPath = path.join(__dirname, '.env');
    const envExists = await fs.pathExists(envPath);
    
    if (!envExists) {
      console.log('⚠️  لم يتم العثور على ملف .env');
      console.log('🔧 يرجى تشغيل الإعداد أولاً:');
      console.log('   npm run setup');
      console.log('');
      console.log('أو إنشاء ملف .env يدوياً مع المحتوى التالي:');
      console.log('DISCORD_TOKEN=your_bot_token_here');
      console.log('PORT=3000');
      console.log('HOST=0.0.0.0');
      return;
    }
    
    // Read .env file
    const envContent = await fs.readFile(envPath, 'utf8');
    const hasToken = envContent.includes('DISCORD_TOKEN=') && 
                    !envContent.includes('DISCORD_TOKEN=your_bot_token_here') &&
                    !envContent.includes('DISCORD_TOKEN=');
    
    if (!hasToken) {
      console.log('⚠️  لم يتم العثور على توكن ديسكورد صحيح في ملف .env');
      console.log('🔧 يرجى تشغيل الإعداد لإضافة التوكن:');
      console.log('   npm run setup');
      console.log('');
      console.log('أو تحرير ملف .env وإضافة:');
      console.log('DISCORD_TOKEN=your_actual_bot_token');
      return;
    }
    
    console.log('✅ تم العثور على ملف .env');
    console.log('🤖 بدء تشغيل البوت...');
    console.log('');
    
    // Start the bot
    const botProcess = spawn('node', ['bot.js'], {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    botProcess.on('error', (error) => {
      console.error('❌ خطأ في تشغيل البوت:', error.message);
    });
    
    botProcess.on('exit', (code) => {
      if (code !== 0) {
        console.log(`\n❌ البوت توقف بكود الخطأ: ${code}`);
        console.log('');
        console.log('💡 نصائح لحل المشاكل:');
        console.log('   1. تحقق من صحة توكن ديسكورد');
        console.log('   2. تأكد من اتصال الإنترنت');
        console.log('   3. تحقق من سجل الأخطاء أعلاه');
        console.log('   4. جرب إعادة تشغيل البوت');
      }
    });
    
    // Handle Ctrl+C
    process.on('SIGINT', () => {
      console.log('\n🛑 إيقاف البوت...');
      botProcess.kill('SIGINT');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 إيقاف البوت...');
      botProcess.kill('SIGTERM');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ خطأ في بدء التشغيل:', error.message);
  }
}

startBot();

