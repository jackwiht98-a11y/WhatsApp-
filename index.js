const { Client, LocalAuth } = require('whatsapp-web.js');

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
    // ESTA LÍNEA ARREGLA EL ERROR DE 'evaluate'
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    }
});

client.on('qr', async (qr) => {
    console.log('QR recibido, generando pairing code...');
    try {
        // IMPORTANTE: Cambia por tu número 521XXXXXXXXXX
        const pairingCode = await client.requestPairingCode("522295213271"); 
        console.log('========================');
        console.log('PAIRING CODE:', pairingCode);
        console.log('========================');
    } catch (err) {
        console.log('Error generando pairing code:', err);
    }
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('authenticated', () => {
    console.log('Autenticado correctamente');
});

client.initialize();
