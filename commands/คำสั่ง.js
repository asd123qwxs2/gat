const fs = require('fs');
const path = require('path');

module.exports = {
    name: '!คำสั่ง',
    description: 'แสดงรายชื่อคำสั่งทั้งหมด พร้อมแสดงภาพประกอบและสถานะ',
    execute(message, args, botClient) {
        const commandFiles = fs.readdirSync(path.join(__dirname, '..', 'commands')).filter(file => file.endsWith('.js'));

        const commandList = commandFiles.map(file => `!${file.replace('.js', '')}`).join('\n');

        const uptime = botClient.uptime; // เวลาที่บอททำงาน
        const ping = botClient.ws.ping; // ความปิงของบอท

        const embed = {
            color: 0x0099ff,
            title: '📜 รายชื่อคำสั่งทั้งหมด',
            description: `คำสั่งที่สามารถใช้งานได้:\n${commandList}`,
            image: {
                url: 'https://img2.pic.in.th/pic/7087.gif_wh300.gif' // เพิ่ม GIF ตามที่ต้องการ
            },
            footer: {
                text: `Uptime: ${formatUptime(uptime)} | Ping: ${ping}ms`
            }
        };

        message.reply({ embeds: [embed] });
    }
};


function formatUptime(ms) {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}
