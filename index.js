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

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('pairing-code', (code) => {
    console.log('========================');
    console.log('PAIRING CODE:', code);
    console.log('========================');
});

// CAMBIA ESTO: Pon tu número completo con 521 + 10 dígitos
// Ejemplo México: 5215512345678
client.requestPairingCode("521TU_NUMERO_AQUI");

client.initialize();
