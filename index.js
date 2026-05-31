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
    }
});

// Cuando WhatsApp pide el QR, mejor generamos el pairing code
client.on('qr', async (qr) => {
    console.log('QR recibido, generando pairing code...');
    // CAMBIA ESTO por tu número: 521 + 10 dígitos
    const pairingCode = await client.requestPairingCode("522295213271"); 
    console.log('========================');
    console.log('PAIRING CODE:', pairingCode);
    console.log('========================');
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('authenticated', () => {
    console.log('Autenticado correctamente');
});

client.initialize();
