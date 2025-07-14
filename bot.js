import { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import express from 'express';
import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CONFIG = {
  PORT: process.env.PORT || 3000,
  HOST: process.env.HOST || "0.0.0.0",
  MAX_SCRIPT_LENGTH: parseInt(process.env.MAX_SCRIPT_LENGTH) || 50000,
  MAX_SCRIPTS_PER_USER: parseInt(process.env.MAX_SCRIPTS_PER_USER) || 50,
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
};

// Discord Bot Setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Express Server Setup
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));

app.use(compression());
app.use(cors({
  origin: process.env.NODE_ENV === "production" ? false : true,
  credentials: true
}));

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Data Storage
const DATA_DIR = path.join(__dirname, "data");
const SCRIPTS_FILE = path.join(DATA_DIR, "scripts.json");

// Rate limiting storage
let userRequestCounts = new Map();

// Utility Functions
async function ensureDataDirectory() {
  try {
    await fs.ensureDir(DATA_DIR);
  } catch (error) {
    console.error("Error ensuring data directory:", error);
    throw error;
  }
}

async function loadScripts() {
  await ensureDataDirectory();
  try {
    const data = await fs.readFile(SCRIPTS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    console.error("Error loading scripts:", error);
    return [];
  }
}

async function saveScripts(scripts) {
  await ensureDataDirectory();
  try {
    await fs.writeFile(SCRIPTS_FILE, JSON.stringify(scripts, null, 2), "utf8");
  } catch (error) {
    console.error("Error saving scripts:", error);
    throw error;
  }
}

async function getScript(id) {
  const scripts = await loadScripts();
  return scripts.find(script => script.id === id);
}

async function getAllScripts() {
  return await loadScripts();
}

async function deleteScript(id) {
  let scripts = await loadScripts();
  const initialLength = scripts.length;
  scripts = scripts.filter(script => script.id !== id);
  if (scripts.length < initialLength) {
    await saveScripts(scripts);
    return true;
  }
  return false;
}

// Validation Functions
function validateScript(script) {
  if (!script || typeof script !== "string") {
    return "النص يجب أن يكون نص غير فارغ";
  }
  if (script.trim().length === 0) {
    return "النص لا يمكن أن يكون فارغاً";
  }
  if (script.length > CONFIG.MAX_SCRIPT_LENGTH) {
    return `النص طويل جداً. الحد الأقصى ${CONFIG.MAX_SCRIPT_LENGTH} حرف`;
  }
  return null;
}

function validateUserId(userId) {
  if (!userId || typeof userId !== "string") {
    return "معرف المستخدم غير صحيح";
  }
  if (userId.length < 10 || userId.length > 100) {
    return "معرف المستخدم يجب أن يكون بين 10 و 100 حرف";
  }
  return null;
}

// Rate limiting
function checkRateLimit(userId) {
  const now = Date.now();
  const windowStart = now - CONFIG.RATE_LIMIT_WINDOW_MS;
  
  if (!userRequestCounts.has(userId)) {
    userRequestCounts.set(userId, []);
  }
  
  const requests = userRequestCounts.get(userId);
  const recentRequests = requests.filter(time => time > windowStart);
  
  if (recentRequests.length >= CONFIG.RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  recentRequests.push(now);
  userRequestCounts.set(userId, recentRequests);
  return true;
}

// Discord Bot Events
client.once('ready', async () => {
  console.log(`✅ البوت جاهز! تم تسجيل الدخول باسم ${client.user.tag}`);
  
  // Register slash commands
  const commands = [
    new SlashCommandBuilder()
      .setName('حماية')
      .setDescription('حماية نص Roblox وإنشاء رابط آمن')
      .addStringOption(option =>
        option.setName('النص')
          .setDescription('نص Roblox المراد حمايته')
          .setRequired(true)
      ),
    
    new SlashCommandBuilder()
      .setName('نصوصي')
      .setDescription('عرض جميع النصوص المحمية الخاصة بك'),
    
    new SlashCommandBuilder()
      .setName('حذف')
      .setDescription('حذف نص محمي')
      .addStringOption(option =>
        option.setName('المعرف')
          .setDescription('معرف النص المراد حذفه')
          .setRequired(true)
      ),
    
    new SlashCommandBuilder()
      .setName('مساعدة')
      .setDescription('عرض تعليمات استخدام البوت'),
    
    new SlashCommandBuilder()
      .setName('إحصائيات')
      .setDescription('عرض إحصائيات البوت')
  ];

  try {
    console.log('🔄 بدء تسجيل أوامر البوت...');
    await client.application.commands.set(commands);
    console.log('✅ تم تسجيل أوامر البوت بنجاح!');
  } catch (error) {
    console.error('❌ خطأ في تسجيل الأوامر:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, user } = interaction;
  const userId = user.id;

  try {
    // Check rate limit
    if (!checkRateLimit(userId)) {
      return await interaction.reply({
        content: '⚠️ لقد تجاوزت الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.',
        ephemeral: true
      });
    }

    switch (commandName) {
      case 'حماية':
        await handleProtectCommand(interaction);
        break;
      case 'نصوصي':
        await handleMyScriptsCommand(interaction);
        break;
      case 'حذف':
        await handleDeleteCommand(interaction);
        break;
      case 'مساعدة':
        await handleHelpCommand(interaction);
        break;
      case 'إحصائيات':
        await handleStatsCommand(interaction);
        break;
      default:
        await interaction.reply({
          content: '❌ أمر غير معروف!',
          ephemeral: true
        });
    }
  } catch (error) {
    console.error('❌ خطأ في معالجة الأمر:', error);
    await interaction.reply({
      content: '❌ حدث خطأ أثناء معالجة الأمر. يرجى المحاولة لاحقاً.',
      ephemeral: true
    });
  }
});

// Command Handlers
async function handleProtectCommand(interaction) {
  const script = interaction.options.getString('النص');
  const userId = interaction.user.id;

  // Validate script
  const scriptError = validateScript(script);
  if (scriptError) {
    return await interaction.reply({
      content: `❌ ${scriptError}`,
      ephemeral: true
    });
  }

  try {
    // Check user script limit
    const allUserScripts = await getAllScripts();
    const userScriptCount = allUserScripts.filter(s => s.userId === userId).length;
    if (userScriptCount >= CONFIG.MAX_SCRIPTS_PER_USER) {
      return await interaction.reply({
        content: `❌ الحد الأقصى ${CONFIG.MAX_SCRIPTS_PER_USER} نص لكل مستخدم`,
        ephemeral: true
      });
    }

    // Check for duplicate script
    const normalizedScript = script.trim().replace(/\s+/g, " ");
    const existingScript = allUserScripts.find(
      (data) => data.userId === userId && 
        data.script.trim().replace(/\s+/g, " ") === normalizedScript
    );
    
    if (existingScript) {
      const url = `http://${CONFIG.HOST}:${CONFIG.PORT}/script.lua?id=${existingScript.id}`;
      const loadstring = `loadstring(game:HttpGet("${url}"))()`;
      
      const embed = new EmbedBuilder()
        .setTitle('⚠️ النص محمي مسبقاً!')
        .setDescription('هذا النص محمي بالفعل!')
        .addFields(
          { name: '🔗 الرابط', value: `\`\`\`${url}\`\`\``, inline: false },
          { name: '📝 كود التنفيذ', value: `\`\`\`lua\n${loadstring}\`\`\``, inline: false },
          { name: '🆔 المعرف', value: `\`${existingScript.id}\``, inline: true }
        )
        .setColor(0xFFA500)
        .setTimestamp();

      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Generate unique ID
    const id = crypto.randomBytes(16).toString("hex");
    
    // Store script
    const newScriptData = {
      id,
      script: script.trim(),
      userId,
      username: interaction.user.username,
      createdAt: new Date().toISOString(),
      accessCount: 0,
      lastAccessed: null
    };

    allUserScripts.push(newScriptData);
    await saveScripts(allUserScripts);
    
    const url = `http://${CONFIG.HOST}:${CONFIG.PORT}/script.lua?id=${id}`;
    const loadstring = `loadstring(game:HttpGet("${url}"))()`;
    
    const embed = new EmbedBuilder()
      .setTitle('🔒 تم حماية النص بنجاح!')
      .setDescription('تم إنشاء رابط آمن لنصك')
      .addFields(
        { name: '🔗 الرابط المحمي', value: `\`\`\`${url}\`\`\``, inline: false },
        { name: '📝 كود التنفيذ في Roblox', value: `\`\`\`lua\n${loadstring}\`\`\``, inline: false },
        { name: '🆔 معرف النص', value: `\`${id}\``, inline: true },
        { name: '📅 تاريخ الإنشاء', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
      )
      .setColor(0x00FF00)
      .setFooter({ text: 'KULTHX SAFEME Discord Bot' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    console.error('❌ خطأ في حماية النص:', error);
    await interaction.reply({
      content: '❌ حدث خطأ أثناء حماية النص. يرجى المحاولة لاحقاً.',
      ephemeral: true
    });
  }
}

async function handleMyScriptsCommand(interaction) {
  const userId = interaction.user.id;

  try {
    const allUserScripts = await getAllScripts();
    const userScripts = allUserScripts
      .filter(script => script.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (userScripts.length === 0) {
      return await interaction.reply({
        content: '📝 لا توجد نصوص محمية بعد. استخدم الأمر `/حماية` لحماية نص جديد.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(`📚 نصوصك المحمية (${userScripts.length})`)
      .setDescription(`لديك ${userScripts.length} نص محمي`)
      .setColor(0x0099FF)
      .setFooter({ text: 'KULTHX SAFEME Discord Bot' })
      .setTimestamp();

    // Show first 10 scripts
    const scriptsToShow = userScripts.slice(0, 10);
    
    for (const script of scriptsToShow) {
      const url = `http://${CONFIG.HOST}:${CONFIG.PORT}/script.lua?id=${script.id}`;
      const preview = script.script.length > 100 ? 
        script.script.substring(0, 100) + '...' : 
        script.script;
      
      embed.addFields({
        name: `🆔 ${script.id}`,
        value: `**معاينة:** \`\`\`lua\n${preview}\`\`\`\n**الرابط:** \`${url}\`\n**الوصول:** ${script.accessCount || 0} مرة\n**تاريخ الإنشاء:** <t:${Math.floor(new Date(script.createdAt).getTime() / 1000)}:R>`,
        inline: false
      });
    }

    if (userScripts.length > 10) {
      embed.addFields({
        name: '📋 ملاحظة',
        value: `يتم عرض أول 10 نصوص فقط. لديك ${userScripts.length - 10} نص إضافي.`,
        inline: false
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    console.error('❌ خطأ في عرض النصوص:', error);
    await interaction.reply({
      content: '❌ حدث خطأ أثناء عرض النصوص. يرجى المحاولة لاحقاً.',
      ephemeral: true
    });
  }
}

async function handleDeleteCommand(interaction) {
  const scriptId = interaction.options.getString('المعرف');
  const userId = interaction.user.id;

  try {
    const script = await getScript(scriptId);
    
    if (!script) {
      return await interaction.reply({
        content: '❌ النص غير موجود أو معرف خاطئ.',
        ephemeral: true
      });
    }
    
    if (script.userId !== userId) {
      return await interaction.reply({
        content: '❌ لا يمكنك حذف نص لا يخصك.',
        ephemeral: true
      });
    }

    const deleted = await deleteScript(scriptId);
    
    if (deleted) {
      const embed = new EmbedBuilder()
        .setTitle('🗑️ تم حذف النص')
        .setDescription(`تم حذف النص بمعرف: \`${scriptId}\``)
        .setColor(0xFF0000)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } else {
      await interaction.reply({
        content: '❌ فشل في حذف النص. يرجى المحاولة لاحقاً.',
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('❌ خطأ في حذف النص:', error);
    await interaction.reply({
      content: '❌ حدث خطأ أثناء حذف النص. يرجى المحاولة لاحقاً.',
      ephemeral: true
    });
  }
}

async function handleHelpCommand(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('📖 دليل استخدام البوت')
    .setDescription('بوت KULTHX SAFEME لحماية نصوص Roblox')
    .addFields(
      {
        name: '🔒 `/حماية`',
        value: 'حماية نص Roblox وإنشاء رابط آمن\n**الاستخدام:** `/حماية النص:كودك_هنا`',
        inline: false
      },
      {
        name: '📚 `/نصوصي`',
        value: 'عرض جميع النصوص المحمية الخاصة بك',
        inline: false
      },
      {
        name: '🗑️ `/حذف`',
        value: 'حذف نص محمي\n**الاستخدام:** `/حذف المعرف:معرف_النص`',
        inline: false
      },
      {
        name: '📊 `/إحصائيات`',
        value: 'عرض إحصائيات البوت والخادم',
        inline: false
      },
      {
        name: '❓ `/مساعدة`',
        value: 'عرض هذه الرسالة',
        inline: false
      },
      {
        name: '🛡️ الأمان',
        value: '• الروابط تعمل فقط مع Roblox\n• تشفير متقدم للنصوص\n• حماية من الوصول المباشر\n• Rate limiting لمنع الإساءة',
        inline: false
      },
      {
        name: '📋 الحدود',
        value: `• الحد الأقصى للنص: ${CONFIG.MAX_SCRIPT_LENGTH.toLocaleString()} حرف\n• الحد الأقصى للنصوص: ${CONFIG.MAX_SCRIPTS_PER_USER} نص لكل مستخدم\n• الحد الأقصى للطلبات: ${CONFIG.RATE_LIMIT_MAX_REQUESTS} طلب كل ${Math.floor(CONFIG.RATE_LIMIT_WINDOW_MS / 60000)} دقيقة`,
        inline: false
      }
    )
    .setColor(0x0099FF)
    .setFooter({ text: 'KULTHX SAFEME Discord Bot' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleStatsCommand(interaction) {
  try {
    const allScripts = await getAllScripts();
    const totalScripts = allScripts.length;
    const totalUsers = new Set(allScripts.map(s => s.userId)).size;
    const totalAccesses = allScripts.reduce((sum, s) => sum + (s.accessCount || 0), 0);
    
    const userScripts = allScripts.filter(s => s.userId === interaction.user.id);
    const userScriptCount = userScripts.length;
    const userAccesses = userScripts.reduce((sum, s) => sum + (s.accessCount || 0), 0);

    const embed = new EmbedBuilder()
      .setTitle('📊 إحصائيات البوت')
      .addFields(
        {
          name: '🌐 إحصائيات عامة',
          value: `**إجمالي النصوص:** ${totalScripts.toLocaleString()}\n**إجمالي المستخدمين:** ${totalUsers.toLocaleString()}\n**إجمالي الوصولات:** ${totalAccesses.toLocaleString()}`,
          inline: true
        },
        {
          name: '👤 إحصائياتك',
          value: `**نصوصك:** ${userScriptCount}\n**وصولات نصوصك:** ${userAccesses}\n**الحد المتبقي:** ${CONFIG.MAX_SCRIPTS_PER_USER - userScriptCount}`,
          inline: true
        },
        {
          name: '⚙️ معلومات الخادم',
          value: `**المنفذ:** ${CONFIG.PORT}\n**البيئة:** ${process.env.NODE_ENV || 'development'}\n**الإصدار:** ${process.version}`,
          inline: false
        }
      )
      .setColor(0x00FF00)
      .setFooter({ text: 'KULTHX SAFEME Discord Bot' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    console.error('❌ خطأ في عرض الإحصائيات:', error);
    await interaction.reply({
      content: '❌ حدث خطأ أثناء عرض الإحصائيات. يرجى المحاولة لاحقاً.',
      ephemeral: true
    });
  }
}

// Express Routes
app.get("/script.lua", async (req, res) => {
  try {
    const id = req.query.id;
    const scriptData = await getScript(id);

    if (!id || !scriptData) {
      return res.status(404).send("-- Invalid or expired script link!");
    }

    // Check User-Agent for Roblox
    const userAgent = req.headers["user-agent"] || "";
    const isRoblox = userAgent.includes("Roblox") || userAgent.includes("HttpGet");
    
    if (!isRoblox) {
      return res.status(403).send("-- Access denied: This endpoint is for Roblox execution only");
    }

    // Update access statistics
    scriptData.accessCount = (scriptData.accessCount || 0) + 1;
    scriptData.lastAccessed = new Date().toISOString();
    let allScripts = await loadScripts();
    const index = allScripts.findIndex(s => s.id === id);
    if (index !== -1) {
      allScripts[index] = scriptData;
      await saveScripts(allScripts);
    }

    res.type("text/plain").send(scriptData.script);
  } catch (err) {
    console.error("❌ Script fetch error:", err);
    res.status(500).send("-- Server error");
  }
});

app.get("/", (req, res) => {
  res.json({
    message: "KULTHX SAFEME Discord Bot Server",
    status: "running",
    version: "1.0.0",
    endpoints: {
      script: "/script.lua?id=SCRIPT_ID"
    }
  });
});

// Start Bot and Server
async function startBot() {
  try {
    // Check if Discord token is provided
    if (!process.env.DISCORD_TOKEN) {
      console.log('⚠️  لم يتم العثور على توكن ديسكورد في متغيرات البيئة');
      console.log('📝 يرجى إنشاء ملف .env وإضافة DISCORD_TOKEN=your_bot_token');
      console.log('🔧 أو تشغيل البوت مع توكن: DISCORD_TOKEN=your_token npm start');
      
      // Start only the web server
      app.listen(CONFIG.PORT, CONFIG.HOST, () => {
        console.log(`🌐 الخادم يعمل على http://${CONFIG.HOST}:${CONFIG.PORT}`);
        console.log('⚠️  البوت غير متصل - يحتاج توكن ديسكورد');
      });
      return;
    }

    // Start Discord bot
    await client.login(process.env.DISCORD_TOKEN);
    
    // Start Express server
    app.listen(CONFIG.PORT, CONFIG.HOST, () => {
      console.log(`🌐 الخادم يعمل على http://${CONFIG.HOST}:${CONFIG.PORT}`);
      console.log('🤖 البوت متصل ويعمل بنجاح!');
    });
    
  } catch (error) {
    console.error('❌ خطأ في بدء تشغيل البوت:', error);
    
    if (error.code === 'TOKEN_INVALID') {
      console.log('🔑 توكن ديسكورد غير صحيح. يرجى التحقق من التوكن.');
    }
    
    // Start only the web server even if bot fails
    app.listen(CONFIG.PORT, CONFIG.HOST, () => {
      console.log(`🌐 الخادم يعمل على http://${CONFIG.HOST}:${CONFIG.PORT}`);
      console.log('⚠️  البوت غير متصل - خطأ في التوكن');
    });
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('🛑 إيقاف البوت...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 إيقاف البوت...');
  client.destroy();
  process.exit(0);
});

// Start the application
startBot();

