import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import crypto from 'crypto';
import fs from 'fs-extra';
import helmet from 'helmet';
import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Bot instance and status
let botClient = null;
let botStatus = {
    connected: false,
    botName: null,
    serverCount: 0,
    token: null
};

// Data storage
const DATA_DIR = path.join(__dirname, 'data');
const SCRIPTS_FILE = path.join(DATA_DIR, 'scripts.json');

// Ensure data directory exists
await fs.ensureDir(DATA_DIR);

// Load scripts data
let scriptsData = {};
try {
    if (await fs.pathExists(SCRIPTS_FILE)) {
        scriptsData = await fs.readJson(SCRIPTS_FILE);
    }
} catch (error) {
    console.error('Error loading scripts data:', error);
    scriptsData = {};
}

// Save scripts data
async function saveScriptsData() {
    try {
        await fs.writeJson(SCRIPTS_FILE, scriptsData, { spaces: 2 });
    } catch (error) {
        console.error('Error saving scripts data:', error);
    }
}

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, '../web-interface')));

// Rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100; // 100 requests per window

function rateLimit(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return next();
    }
    
    const limit = rateLimitMap.get(ip);
    
    if (now > limit.resetTime) {
        limit.count = 1;
        limit.resetTime = now + RATE_LIMIT_WINDOW;
        return next();
    }
    
    if (limit.count >= RATE_LIMIT_MAX) {
        return res.status(429).json({ error: 'Too many requests' });
    }
    
    limit.count++;
    next();
}

// Utility functions
function generateId() {
    return crypto.randomBytes(16).toString('hex');
}

function encryptScript(script) {
    const key = process.env.ENCRYPTION_KEY || 'default-key-change-this-in-production';
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(script, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

function decryptScript(encryptedScript) {
    try {
        const key = process.env.ENCRYPTION_KEY || 'default-key-change-this-in-production';
        const decipher = crypto.createDecipher('aes-256-cbc', key);
        let decrypted = decipher.update(encryptedScript, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        return null;
    }
}

// Discord bot commands
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
        .setName('إحصائيات')
        .setDescription('عرض إحصائيات البوت'),
    
    new SlashCommandBuilder()
        .setName('مساعدة')
        .setDescription('عرض تعليمات استخدام البوت')
];

// Register slash commands
async function registerCommands(token, clientId) {
    try {
        const rest = new REST({ version: '10' }).setToken(token);
        
        console.log('Started refreshing application (/) commands.');
        
        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands }
        );
        
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

// Create and configure bot
async function createBot(token) {
    try {
        // Destroy existing bot if any
        if (botClient) {
            botClient.destroy();
            botClient = null;
        }

        // Create new bot client
        botClient = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });

        // Bot event handlers
        botClient.once('ready', async () => {
            console.log(`✅ Bot logged in as ${botClient.user.tag}`);
            
            botStatus.connected = true;
            botStatus.botName = botClient.user.tag;
            botStatus.serverCount = botClient.guilds.cache.size;
            botStatus.token = token;

            // Register slash commands
            await registerCommands(token, botClient.user.id);
        });

        botClient.on('error', (error) => {
            console.error('Bot error:', error);
            botStatus.connected = false;
        });

        botClient.on('disconnect', () => {
            console.log('Bot disconnected');
            botStatus.connected = false;
        });

        // Handle slash commands
        botClient.on('interactionCreate', async (interaction) => {
            if (!interaction.isChatInputCommand()) return;

            const { commandName, user } = interaction;

            try {
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
                    case 'إحصائيات':
                        await handleStatsCommand(interaction);
                        break;
                    case 'مساعدة':
                        await handleHelpCommand(interaction);
                        break;
                    default:
                        await interaction.reply({
                            content: '❌ أمر غير معروف',
                            ephemeral: true
                        });
                }
            } catch (error) {
                console.error('Command error:', error);
                await interaction.reply({
                    content: '❌ حدث خطأ أثناء تنفيذ الأمر',
                    ephemeral: true
                });
            }
        });

        // Login bot
        await botClient.login(token);
        
        return { success: true, message: 'Bot started successfully' };
    } catch (error) {
        console.error('Error creating bot:', error);
        botStatus.connected = false;
        
        if (error.code === 'TOKEN_INVALID') {
            return { success: false, error: 'توكن البوت غير صحيح' };
        } else if (error.code === 'DISALLOWED_INTENTS') {
            return { success: false, error: 'البوت لا يملك الصلاحيات المطلوبة' };
        } else {
            return { success: false, error: 'فشل في تشغيل البوت: ' + error.message };
        }
    }
}

// Command handlers
async function handleProtectCommand(interaction) {
    const script = interaction.options.getString('النص');
    const userId = interaction.user.id;

    if (!scriptsData[userId]) {
        scriptsData[userId] = [];
    }

    if (scriptsData[userId].length >= 50) {
        await interaction.reply({
            content: '❌ لقد وصلت إلى الحد الأقصى من النصوص (50 نص)',
            ephemeral: true
        });
        return;
    }

    const scriptId = generateId();
    const encryptedScript = encryptScript(script);
    
    const scriptData = {
        id: scriptId,
        encrypted: encryptedScript,
        createdAt: new Date().toISOString(),
        accessCount: 0
    };

    scriptsData[userId].push(scriptData);
    await saveScriptsData();

    const scriptUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/script.lua?id=${scriptId}`;

    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ تم حماية النص بنجاح')
        .addFields(
            { name: '🔗 الرابط المحمي', value: `\`\`\`${scriptUrl}\`\`\``, inline: false },
            { name: '🆔 معرف النص', value: `\`${scriptId}\``, inline: true },
            { name: '📅 تاريخ الإنشاء', value: new Date().toLocaleString('ar-SA'), inline: true }
        )
        .setFooter({ text: 'KULTHX SAFEME - حماية متقدمة للنصوص' })
        .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleMyScriptsCommand(interaction) {
    const userId = interaction.user.id;
    const userScripts = scriptsData[userId] || [];

    if (userScripts.length === 0) {
        await interaction.reply({
            content: '📝 لا توجد نصوص محمية. استخدم `/حماية` لحماية نص جديد.',
            ephemeral: true
        });
        return;
    }

    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📋 نصوصك المحمية')
        .setDescription(`لديك ${userScripts.length} نص محمي`)
        .setFooter({ text: 'KULTHX SAFEME - حماية متقدمة للنصوص' })
        .setTimestamp();

    userScripts.slice(0, 10).forEach((script, index) => {
        const createdDate = new Date(script.createdAt).toLocaleString('ar-SA');
        embed.addFields({
            name: `📄 نص ${index + 1}`,
            value: `**المعرف:** \`${script.id}\`\n**تاريخ الإنشاء:** ${createdDate}\n**مرات الوصول:** ${script.accessCount}`,
            inline: true
        });
    });

    if (userScripts.length > 10) {
        embed.setDescription(`لديك ${userScripts.length} نص محمي (عرض أول 10 نصوص)`);
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleDeleteCommand(interaction) {
    const scriptId = interaction.options.getString('المعرف');
    const userId = interaction.user.id;

    if (!scriptsData[userId]) {
        await interaction.reply({
            content: '❌ لا توجد نصوص محمية لحذفها',
            ephemeral: true
        });
        return;
    }

    const scriptIndex = scriptsData[userId].findIndex(script => script.id === scriptId);
    
    if (scriptIndex === -1) {
        await interaction.reply({
            content: '❌ لم يتم العثور على النص المحدد',
            ephemeral: true
        });
        return;
    }

    scriptsData[userId].splice(scriptIndex, 1);
    await saveScriptsData();

    await interaction.reply({
        content: `✅ تم حذف النص بمعرف \`${scriptId}\` بنجاح`,
        ephemeral: true
    });
}

async function handleStatsCommand(interaction) {
    const totalScripts = Object.values(scriptsData).reduce((sum, userScripts) => sum + userScripts.length, 0);
    const totalUsers = Object.keys(scriptsData).length;
    const totalAccess = Object.values(scriptsData).reduce((sum, userScripts) => 
        sum + userScripts.reduce((userSum, script) => userSum + script.accessCount, 0), 0);

    const embed = new EmbedBuilder()
        .setColor('#ff9900')
        .setTitle('📊 إحصائيات البوت')
        .addFields(
            { name: '👥 المستخدمين', value: totalUsers.toString(), inline: true },
            { name: '📄 النصوص المحمية', value: totalScripts.toString(), inline: true },
            { name: '🔗 مرات الوصول', value: totalAccess.toString(), inline: true },
            { name: '🤖 حالة البوت', value: botStatus.connected ? '🟢 متصل' : '🔴 غير متصل', inline: true },
            { name: '🏠 الخوادم', value: botStatus.serverCount.toString(), inline: true },
            { name: '⏰ وقت التشغيل', value: process.uptime() > 3600 ? `${Math.floor(process.uptime() / 3600)} ساعة` : `${Math.floor(process.uptime() / 60)} دقيقة`, inline: true }
        )
        .setFooter({ text: 'KULTHX SAFEME - حماية متقدمة للنصوص' })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handleHelpCommand(interaction) {
    const embed = new EmbedBuilder()
        .setColor('#9932cc')
        .setTitle('❓ مساعدة البوت')
        .setDescription('دليل استخدام KULTHX SAFEME Discord Bot')
        .addFields(
            { name: '🔒 `/حماية`', value: 'حماية نص Roblox وإنشاء رابط آمن\n**الاستخدام:** `/حماية النص:كودك هنا`', inline: false },
            { name: '📋 `/نصوصي`', value: 'عرض جميع النصوص المحمية الخاصة بك', inline: false },
            { name: '🗑️ `/حذف`', value: 'حذف نص محمي\n**الاستخدام:** `/حذف المعرف:abc123`', inline: false },
            { name: '📊 `/إحصائيات`', value: 'عرض إحصائيات البوت والاستخدام', inline: false },
            { name: '❓ `/مساعدة`', value: 'عرض هذه الرسالة', inline: false }
        )
        .addFields(
            { name: '🎮 كيفية استخدام النص في Roblox', value: '```lua\nloadstring(game:HttpGet("رابط_النص_هنا"))()\n```', inline: false }
        )
        .setFooter({ text: 'KULTHX SAFEME - حماية متقدمة للنصوص' })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

// API Routes
app.get('/api/bot/status', (req, res) => {
    res.json(botStatus);
});

app.post('/api/bot/start', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    const result = await createBot(token);
    
    if (result.success) {
        res.json({
            success: true,
            message: result.message,
            connected: botStatus.connected,
            botName: botStatus.botName,
            serverCount: botStatus.serverCount
        });
    } else {
        res.status(400).json({ error: result.error });
    }
});

app.post('/api/bot/stop', (req, res) => {
    if (botClient) {
        botClient.destroy();
        botClient = null;
        botStatus.connected = false;
        botStatus.botName = null;
        botStatus.serverCount = 0;
        botStatus.token = null;
    }
    
    res.json({ success: true, message: 'Bot stopped' });
});

// Script serving endpoint
app.get('/script.lua', rateLimit, async (req, res) => {
    const { id } = req.query;
    const userAgent = req.get('User-Agent') || '';

    // Check if request is from Roblox
    if (!userAgent.includes('Roblox')) {
        return res.status(403).send('Access denied: This endpoint is only accessible from Roblox');
    }

    if (!id) {
        return res.status(400).send('Script ID is required');
    }

    // Find script in all users' data
    let foundScript = null;
    let foundUserId = null;

    for (const [userId, userScripts] of Object.entries(scriptsData)) {
        const script = userScripts.find(s => s.id === id);
        if (script) {
            foundScript = script;
            foundUserId = userId;
            break;
        }
    }

    if (!foundScript) {
        return res.status(404).send('Script not found');
    }

    // Decrypt script
    const decryptedScript = decryptScript(foundScript.encrypted);
    if (!decryptedScript) {
        return res.status(500).send('Error decrypting script');
    }

    // Update access count
    foundScript.accessCount++;
    await saveScriptsData();

    // Set appropriate headers
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.send(decryptedScript);
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../web-interface/index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, HOST, () => {
    console.log(`🚀 KULTHX SAFEME Web Server running on http://${HOST}:${PORT}`);
    console.log(`📱 Open http://localhost:${PORT} to configure your Discord bot`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    if (botClient) {
        botClient.destroy();
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    if (botClient) {
        botClient.destroy();
    }
    process.exit(0);
});

