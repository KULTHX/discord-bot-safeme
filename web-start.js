import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function startWebServer() {
  console.log('🌐 بدء تشغيل KULTHX SAFEME Web Interface...');
  console.log('=' .repeat(60));
  
  try {
    // Check if web-interface directory exists
    const webInterfacePath = path.join(__dirname, '../web-interface');
    const webInterfaceExists = await fs.pathExists(webInterfacePath);
    
    if (!webInterfaceExists) {
      console.log('⚠️  مجلد واجهة الويب غير موجود');
      console.log('🔧 يرجى التأكد من وجود مجلد web-interface');
      return;
    }
    
    console.log('✅ تم العثور على واجهة الويب');
    console.log('🚀 بدء تشغيل الخادم...');
    console.log('');
    console.log('📱 ستتمكن من الوصول إلى واجهة الويب على:');
    console.log('   http://localhost:3000');
    console.log('');
    console.log('💡 لإيقاف الخادم، اضغط Ctrl+C');
    console.log('');
    
    // Start the web server
    const serverProcess = spawn('node', ['web-server.js'], {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    serverProcess.on('error', (error) => {
      console.error('❌ خطأ في تشغيل الخادم:', error.message);
    });
    
    serverProcess.on('exit', (code) => {
      if (code !== 0) {
        console.log(`\n❌ الخادم توقف بكود الخطأ: ${code}`);
        console.log('');
        console.log('💡 نصائح لحل المشاكل:');
        console.log('   1. تحقق من أن المنفذ 3000 غير مستخدم');
        console.log('   2. تأكد من تثبيت جميع المكتبات: npm install');
        console.log('   3. تحقق من سجل الأخطاء أعلاه');
        console.log('   4. جرب إعادة تشغيل الخادم');
      }
    });
    
    // Handle Ctrl+C
    process.on('SIGINT', () => {
      console.log('\n🛑 إيقاف الخادم...');
      serverProcess.kill('SIGINT');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 إيقاف الخادم...');
      serverProcess.kill('SIGTERM');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ خطأ في بدء التشغيل:', error.message);
  }
}

startWebServer();

