const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');


let botList = [];

module.exports = {
    name: 'เพิ่มบอท',
    async execute(message) {
 
        if (botList.length >= 5) {
            return message.reply('คุณสามารถเพิ่มบอทได้สูงสุด 5 ตัวเท่านั้น');
        }


        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('addBot')
                .setLabel('เพิ่มบอทใหม่')
                .setStyle(ButtonStyle.Primary)
        );

        await message.reply({
            content: 'คลิกปุ่มเพื่อเพิ่มบอทใหม่',
            components: [row],
        });
    },

 
    async handleInteraction(interaction) {
        if (interaction.isButton() && interaction.customId === 'addBot') {
     
            const modal = new ModalBuilder()
                .setCustomId('token-modal')
                .setTitle('กรอกโทเค่นของบอทใหม่');
            
     
            const tokenInput = new TextInputBuilder()
                .setCustomId('new-token')
                .setLabel('กรุณากรอกโทเค่นของบอทที่ต้องการเพิ่ม')
                .setStyle(TextInputStyle.Short)
                .setRequired(true); 

            const actionRow = new ActionRowBuilder().addComponents(tokenInput);
            modal.addComponents(actionRow);

         
            await interaction.showModal(modal);
        }
    },

    async addBotToken(interaction) {
        if (interaction.customId === 'token-modal') {
            const newToken = interaction.fields.getTextInputValue('new-token');

         
            if (!newToken) {
                return interaction.reply({ content: '❌ กรุณากรอกโทเค่นของบอท', ephemeral: true });
            }

            if (botList.length < 5) {
                botList.push(newToken);
                interaction.reply({ content: `✅ บอทใหม่ได้ถูกเพิ่มเรียบร้อยแล้ว! โทเค่น: ${newToken}`, ephemeral: true });
            } else {
                interaction.reply({ content: '❌ คุณไม่สามารถเพิ่มบอทได้อีกแล้ว (จำกัด 5 ตัว)', ephemeral: true });
            }
        }
    },
};
