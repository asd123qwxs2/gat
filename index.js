const { Client, GatewayIntentBits, ActivityType, Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 5000;

app.use(express.static('public'));
app.use(bodyParser.json());

let botClient = null;
let isStreaming = false;
const commands = new Collection(); 


const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.set(command.name, command);
}


function startBot(token) {
    botClient = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.DirectMessages
        ]
    });

    botClient.login(token).then(() => {
        botClient.on('ready', () => {
            console.log(`✅ บอทออนไลน์แล้ว: ${botClient.user.username}`);

            if (isStreaming) {
                botClient.user.setActivity('กำลังสตรีมเกมสนุกๆ!', { type: ActivityType.Streaming, url: 'https://www.twitch.tv/your_channel' });
            } else {
                botClient.user.setActivity('ออนไลน์', { type: ActivityType.Watching });
            }
        });

        botClient.on('messageCreate', async (message) => {
            if (message.author.bot) return;

            const args = message.content.trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            if (commands.has(commandName)) {
                try {
                    await commands.get(commandName).execute(message, args, botClient);
                } catch (error) {
                    console.error(error);
                    message.reply('❌ เกิดข้อผิดพลาดขณะพยายามเรียกใช้คำสั่งนี้');
                }
            }
        });

        botClient.on('interactionCreate', async (interaction) => {
            if (interaction.replied || interaction.deferred) return; // หากมีการตอบกลับแล้ว จะไม่ตอบกลับซ้ำ

            if (interaction.isModalSubmit()) {
             
                if (interaction.customId === 'token-modal') {
                    const newToken = interaction.fields.getTextInputValue('new-token');

                    if (!newToken) {
                        return interaction.reply({ content: '❌ กรุณากรอกโทเค่นที่ถูกต้อง', ephemeral: true });
                    }

                    await interaction.reply({ content: '🔄 กำลังเปลี่ยนโทเค่นบอท...', ephemeral: true });

                    botClient.destroy(); 
                    startBot(newToken); 
                    interaction.followUp({ content: '✅ บอทออนไลน์แล้ว!', ephemeral: true });
                }

                if (interaction.customId === 'server-id-modal') {
                    const serverId = interaction.fields.getTextInputValue('server-id');
                    const guild = botClient.guilds.cache.get(serverId);

                    if (!guild) {
                        return interaction.reply({ content: '❌ ไม่พบเซิร์ฟเวอร์ที่ระบุ', ephemeral: true });
                    }

                    try {
                        await guild.leave();
                        interaction.reply({ content: `✅ บอทออกจากเซิร์ฟเวอร์ ${guild.name} (ID: ${guild.id}) แล้ว`, ephemeral: true });
                    } catch (error) {
                        interaction.reply({ content: '❌ ไม่สามารถออกจากเซิร์ฟเวอร์นี้ได้', ephemeral: true });
                    }
                }
            }

            if (interaction.isButton()) {
                if (interaction.customId === 'change-token') {
                    const modal = new ModalBuilder()
                        .setCustomId('token-modal')
                        .setTitle('กรอกโทเค่นใหม่');
                    const tokenInput = new TextInputBuilder()
                        .setCustomId('new-token')
                        .setLabel('กรุณากรอกโทเค่นใหม่')
                        .setStyle(TextInputStyle.Short);

                    const actionRow = new ActionRowBuilder().addComponents(tokenInput);
                    modal.addComponents(actionRow);

                    await interaction.showModal(modal);
                }

                if (interaction.customId === 'settings') {
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('leave-server')
                                .setLabel('ออกจากเซิร์ฟเวอร์')
                                .setStyle(ButtonStyle.Danger),
                            new ButtonBuilder()
                                .setCustomId('bot-info') 
                                .setLabel('ข้อมูลบอท')
                                .setStyle(ButtonStyle.Secondary)
                        );

                    await interaction.reply({
                        content: '🔧 การตั้งค่าบอท',
                        components: [row],
                        ephemeral: true
                    });
                }

                if (interaction.customId === 'leave-server') {
                    const guild = botClient.guilds.cache.get(interaction.guildId);
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('enter-server-id')
                                .setLabel('กรอกไอดีเซิร์ฟเวอร์')
                                .setStyle(ButtonStyle.Primary)
                        );

                    await interaction.reply({
                        content: `✅ บอทอยู่ในเซิร์ฟเวอร์: ${guild.name} (ID: ${guild.id})\nกรุณากรอกไอดีเซิร์ฟเวอร์ที่ต้องการออกจากเซิร์ฟเวอร์นี้`,
                        components: [row],
                        ephemeral: true
                    });
                }

                if (interaction.customId === 'enter-server-id') {
                    const modal = new ModalBuilder()
                        .setCustomId('server-id-modal')
                        .setTitle('กรอกไอดีเซิร์ฟเวอร์ที่ต้องการออก');
                    const serverIdInput = new TextInputBuilder()
                        .setCustomId('server-id')
                        .setLabel('กรุณากรอกไอดีเซิร์ฟเวอร์')
                        .setStyle(TextInputStyle.Short);

                    const actionRow = new ActionRowBuilder().addComponents(serverIdInput);
                    modal.addComponents(actionRow);

                    await interaction.showModal(modal);
                }

                if (interaction.customId === 'bot-info') {
                 
                    if (!botClient) {
                        return interaction.reply({ content: '❌ บอทยังไม่ได้เริ่มทำงาน', ephemeral: true });
                    }

                    
                    const botInfo = {
                        name: botClient.user.username,
                        id: botClient.user.id,
                        status: botClient.user.presence ? botClient.user.presence.status : 'ไม่ทราบ'
                    };

                    const botInfoMessage = `
    📛 **ชื่อบอท:** ${botInfo.name}
    🆔 **ID:** ${botInfo.id}
    📊 **สถานะ:** ${botInfo.status}
    👨‍💻 **ผู้พัฒนา:** ${botInfo.developer || 'SHGOX'}
    ⚠️ **คำเตือน:** ${botInfo.warning || 'บอทตัวนี่ตือบอทตัวทดลองเท่านั้น \n กรุณารอเปิดเดียวเว็บ'}
`;

                    await interaction.reply({
                        content: botInfoMessage,
                        ephemeral: true
                    });
                }
            }
        });

    }).catch(err => {
        console.log(err);
    });
}


app.post('/start-bot', (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.json({ success: false, message: 'ต้องกรอกโทเค่น' });
    }

    startBot(token);
    res.json({ success: true, message: 'บอทกำลังเริ่มต้น...' });
});


app.post('/stop-bot', (req, res) => {
    if (botClient) {
        botClient.destroy();
        res.json({ success: true, message: 'บอทถูกปิดแล้ว' });
        console.log('🛑 บอทหยุดทำงานแล้ว');
    } else {
        res.json({ success: false, message: 'ไม่มีบอทที่กำลังทำงาน' });
    }
});


app.post('/toggle-stream', (req, res) => {
    if (!botClient) {
        return res.json({ success: false, message: 'บอทยังไม่ได้เริ่มทำงาน' });
    }

    isStreaming = !isStreaming;

    if (isStreaming) {
        botClient.user.setActivity('กำลังสตรีมเกมสนุกๆ!', { type: ActivityType.Streaming, url: 'https://www.twitch.tv/your_channel' });
    } else {
        botClient.user.setActivity('ออนไลน์', { type: ActivityType.Watching });
    }

    res.json({ success: true, message: isStreaming ? 'เปิดโหมดสตรีมแล้ว' : 'ปิดโหมดสตรีมแล้ว' });
});


app.post('/leave-server', (req, res) => {
    const { serverID } = req.body;

    if (!botClient || !serverID) {
        return res.json({ success: false, message: 'บอทไม่ได้ทำงานหรือไม่ได้ระบุไอดีเซิร์ฟเวอร์' });
    }

    const guild = botClient.guilds.cache.get(serverID);
    if (!guild) {
        return res.json({ success: false, message: 'ไม่พบเซิร์ฟเวอร์นี้' });
    }

    guild.leave()
        .then(() => res.json({ success: true, message: `บอทออกจากเซิร์ฟเวอร์ ${guild.name} แล้ว` }))
        .catch(err => res.json({ success: false, message: 'ไม่สามารถออกจากเซิร์ฟเวอร์นี้ได้' }));
});

app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
