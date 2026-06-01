const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const Groq = require('groq-sdk');
const fs = require('fs');
// ... todos tus otros require

// Tu API Key de Groq
const groq = new Groq({ apiKey: 'gsk_tu_key_aqui' });

// ==================== INICIO DEL BOT ====================
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('/app/auth');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: { level: 'silent' }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('✅ Bot conectado correctamente');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        // ... todos tus comandos !menu, !ia, etc
    });
}

// Funciones de youtubeDownload, buscarMusica, chatIA van aquí abajo...

// Iniciar el bot
startBot();
