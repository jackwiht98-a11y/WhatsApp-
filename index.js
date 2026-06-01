const { default: makeWASocket, useMultiFileAuthInfo, DisconnectReason } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const Groq = require('groq-sdk');

// ==================== CONFIGURACIÓN ====================
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY }); // Agrega tu API Key en Railway

const downloadsDir = './downloads';
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

// ==================== FUNCIONES ====================

// Función principal de YouTube (Música y Video)
async function youtubeDownload(sock, msg, url, tipo = "audio") {
    const from = msg.key.remoteJid;
    const isVideo = tipo === "video";

    await sock.sendMessage(from, { text: isVideo ? "⏳ Descargando video de YouTube..." : "⏳ Descargando música..." });

    try {
        const timestamp = Date.now();
        const ext = isVideo ? 'mp4' : 'mp3';
        const outputPath = path.join(downloadsDir, `\( {timestamp}. \){ext}`);

        let command = isVideo 
            ? `yt-dlp -f "best[height<=720]" --no-playlist -o "\( {outputPath}" " \){url}"`
            : `yt-dlp -x --audio-format mp3 --audio-quality 0 --no-playlist -o "\( {outputPath}" " \){url}"`;

        execSync(command, { stdio: 'pipe', timeout: 180000 });

        const stats = fs.statSync(outputPath);
        if (stats.size > 90 * 1024 * 1024) {
            fs.unlinkSync(outputPath);
            return await sock.sendMessage(from, { text: "❌ Archivo demasiado grande (máx 90MB)" });
        }

        if (isVideo) {
            await sock.sendMessage(from, {
                video: { url: outputPath },
                caption: "✅ Video descargado",
                mimetype: 'video/mp4'
            }, { quoted: msg });
        } else {
            await sock.sendMessage(from, {
                audio: { url: outputPath },
                mimetype: 'audio/mpeg',
                fileName: `Música_${timestamp}.mp3`
            }, { quoted: msg });
        }

        setTimeout(() => { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); }, 20000);

    } catch (error) {
        console.error(error);
        await sock.sendMessage(from, { text: "❌ Error al descargar. Verifica el enlace." });
    }
}

// Buscar música
async function buscarMusica(sock, msg, query) {
    const from = msg.key.remoteJid;
    await sock.sendMessage(from, { text: "🔎 Buscando en YouTube..." });

    try {
        const result = execSync(`yt-dlp "ytsearch5:${query}" --flat-playlist --dump-json`, { encoding: 'utf-8' });
        const videos = JSON.parse(`[${result.trim().replace(/\n/g, ',')}]`);

        let text = `🎵 *Resultados para:* ${query}\n\n`;
        videos.slice(0, 5).forEach((v, i) => {
            text += `*${i+1}.* ${v.title}\n`;
            text += `   ⏱️ ${v.duration_string || 'N/A'}\n`;
            text += `   🔗 ${v.url}\n\n`;
        });

        text += "Responde con el número para descargar (ej: *1*)";

        await sock.sendMessage(from, { text }, { quoted: msg });
    } catch (e) {
        await sock.sendMessage(from, { text: "❌ No se encontraron resultados." });
    }
}

// Chat con IA (Groq)
async function chatIA(sock, msg, texto) {
    const from = msg.key.remoteJid;
    await sock.sendMessage(from, { text: "🤖 Pensando..." });

    try {
        const response = await groq.chat.completions.create({
            model: "llama3-70b-8192",
            messages: [{ role: "user", content: texto }],
            max_tokens: 700,
            temperature: 0.7
        });

        await sock.sendMessage(from, { 
            text: response.choices[0]?.message?.content || "No pude generar respuesta." 
        }, { quoted: msg });
    } catch (e) {
        await sock.sendMessage(from, { text: "❌ Error con la IA. Verifica que tengas GROQ_API_KEY configurada." });
    }
}

// ==================== INICIO DEL BOT ====================
async function startBot() {
    const sock = makeWASocket({
        auth: await useMultiFileAuthInfo('./auth'),
        printQRInTerminal: true,
        logger: { level: 'silent' }
    });

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
        const msg = messages[0];
        if (!msg.message) return;

        const from = msg.key.remoteJid;
        let text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        if (!text) return;

        // Menú de ayuda
        if (text.toLowerCase() === '!menu' || text.toLowerCase() === 'menu') {
            const menu = `🎉 *BOT DE WHATSAPP*\n\n` +
                        `📌 *Comandos disponibles:*\n\n` +
                        `• *!music* <link> → Descargar música\n` +
                        `• *!video* <link> → Descargar video\n` +
                        `• *!buscar* <nombre> → Buscar música\n` +
                        `• *!ia* <pregunta> → Hablar con IA\n\n` +
                        `Ejemplos:\n` +
                        `!music https://youtu.be/...\n` +
                        `!buscar Bad Bunny Monaco\n` +
                        `!ia ¿Qué es la inteligencia artificial?`;

            await sock.sendMessage(from, { text: menu }, { quoted: msg });
            return;
        }

        // Comandos
        if (text.startsWith('!music') || text.startsWith('!mp3')) {
            const url = text.split(' ')[1];
            if (url) youtubeDownload(sock, msg, url, "audio");
            else await sock.sendMessage(from, { text: "❌ Usa: !music <link de YouTube>" });
        }

        else if (text.startsWith('!video')) {
            const url = text.split(' ')[1];
            if (url) youtubeDownload(sock, msg, url, "video");
            else await sock.sendMessage(from, { text: "❌ Usa: !video <link de YouTube>" });
        }

        else if (text.startsWith('!buscar')) {
            const query = text.slice(8).trim();
            if (query) buscarMusica(sock, msg, query);
        }

        else if (text.startsWith('!ia')) {
            const pregunta = text.slice(4).trim();
            if (pregunta) chatIA(sock, msg, pregunta);
        }
    });
}

startBot(); 
