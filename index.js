const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const ytdl = require('@distube/ytdl-core');
const ytSearch = require('yt-search');
const fs = require('fs');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox'] }
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => console.log('Bot conectado'));

client.on('message', async msg => {
    if (msg.body.startsWith('!play ')) {
        const query = msg.body.slice(6);
        try {
            const r = await ytSearch(query);
            const video = r.videos[0];
            if (!video) return msg.reply('No encontré la canción 😕');

            msg.reply(`Descargando: *${video.title}* ⏳`);

            const filePath = `./${video.videoId}.mp3`;
            ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio' })
              .pipe(fs.createWriteStream(filePath))
              .on('finish', async () => {
                    const media = MessageMedia.fromFilePath(filePath);
                    await client.sendMessage(msg.from, media, { sendAudioAsVoice: false });
                    fs.unlinkSync(filePath);
                });
        } catch (e) {
            msg.reply('Error al descargar. Intenta con otra canción.');
        }
    }
});

client.initialize();
