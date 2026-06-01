const { Client, LocalAuth } = require('whatsapp-web.js');
const qr_image = require('qr-image');
const express = require('express');
const app = express();

let lastQR = '';

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: 'session' }),
    puppeteer: {
        headless: true,
        executablePath: '/usr/bin/chromium',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-zygote',
            '--single-process'
        ]
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    }
});

client.on('qr', (qr) => {
    console.log('QR RECIBIDO. Ve a /qr para escanearlo');
    lastQR = qr;
});

client.on('ready', () => {
    console.log('Client is ready!');
    lastQR = '';
});

client.on('authenticated', () => {
    console.log('Autenticado correctamente');
});

client.initialize();

// Servidor para mostrar el QR
app.get('/qr', (req, res) => {
    if (!lastQR) return res.send('Ya está vinculado o esperando QR...');
    const qr_svg = qr_image.image(lastQR, { type: 'png' });
    res.type('png');
    qr_svg.pipe(res);
});

app.get('/', (req, res) => {
    res.send('Bot activo. Ve a /qr para vincular');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
