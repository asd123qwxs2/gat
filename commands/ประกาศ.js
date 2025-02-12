const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    name: '!ประกาศ',
    async execute(message, args, botClient) {

        const guilds = botClient.guilds.cache.map(guild => `📌 **${guild.name}** (ID: ${guild.id})`).join("\n");

        if (!guilds) {
            return message.reply("❌ บอทยังไม่ได้เข้าร่วมเซิร์ฟเวอร์ใดเลย");
        }

      
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_announcement_modal')
                .setLabel('📢 สร้างประกาศ')
                .setStyle(ButtonStyle.Primary)
        );

 
        await message.reply({
            content: `✅ **บอทอยู่ในเซิร์ฟเวอร์ดังต่อไปนี้:**\n\n${guilds}`,
            components: [row]
        });

    
        botClient.on('interactionCreate', async interaction => {
            if (!interaction.isButton()) return;
            if (interaction.customId !== 'open_announcement_modal') return;

     
            const modal = new ModalBuilder()
                .setCustomId('announcement_modal')
                .setTitle('📢 สร้างประกาศ');

   
            const messageInput = new TextInputBuilder()
                .setCustomId('announcement_message')
                .setLabel('📄 ข้อความที่ต้องการประกาศ')
                .setStyle(TextInputStyle.Paragraph);

      
            const countInput = new TextInputBuilder()
                .setCustomId('announcement_count')
                .setLabel('🔢 จำนวนครั้งที่ต้องการส่ง')
                .setStyle(TextInputStyle.Short);

            modal.addComponents(
                new ActionRowBuilder().addComponents(messageInput),
                new ActionRowBuilder().addComponents(countInput)
            );

            await interaction.showModal(modal);
        });

        botClient.on('interactionCreate', async interaction => {
            if (!interaction.isModalSubmit()) return;
            if (interaction.customId !== 'announcement_modal') return;

            const announcementMessage = interaction.fields.getTextInputValue('announcement_message');
            const announcementCount = parseInt(interaction.fields.getTextInputValue('announcement_count'), 10);

            if (isNaN(announcementCount) || announcementCount <= 0) {
                return interaction.reply({ content: "❌ กรุณากรอกจำนวนที่ถูกต้อง!", ephemeral: true });
            }

            for (let i = 0; i < announcementCount; i++) {
                await interaction.channel.send(`📢 **ประกาศจากบอท:** ${announcementMessage}`);
            }

            await interaction.reply({ content: "✅ ประกาศถูกส่งเรียบร้อย!", ephemeral: true });
        });
    }
};
