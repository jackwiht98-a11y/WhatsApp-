import makeWASocket, { DisconnectReason, useMultiFileAuthState, Browsers } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import express from 'express'
import pino from 'pino'
import QRCode from 'qrcode'

const app = express()
const port = process.env.PORT || 8080
let sock
let qrCodeBase64 = null

app.use(express.json())

// Ruta para ver el QR
app.get('/qr', (req, res) => {
    if (qrCodeBase64) {
        res.send(`
            <html>
                <body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#111;">
                    <div style="text-align:center;">
                        <h2 style="color:white;font-family:sans-serif;">Escanea el QR con WhatsApp</h2>
                        <img src="${qrCodeBase64}" style="width:300px;height:300px;">
                        <p style="color:#999;font-family:sans-serif;">WhatsApp > Dispositivos vinculados > Vincular dispositivo</p>
                    </div>
                </body>
            </html>
        `)
    } else {
        res.send('<h2 style="font-family:sans-serif;">Bot conectado ✅ o esperando QR...</h2>')
    }
})

app.get('/', (req, res) => {
    res.send('Bot WhatsApp Online 🔥')
})

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth')
    
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        browser: Browsers.macOS('Desktop')
    })

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update
        
        if (qr) {
            console.log('QR RECIBIDO. Ve a /qr para escanearlo')
            qrCodeBase64 = await QRCode.toDataURL(qr)
        }
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error instanceof Boom && 
                lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
            
            console.log('Conexion cerrada. Reconectando:', shouldReconnect)
            if (shouldReconnect) {
                connectToWhatsApp()
            }
        } else if (connection === 'open') {
            console.log('✅ Bot conectado correctamente')
            qrCodeBase64 = null
        }
    })

    sock.ev.on('creds.update', saveCreds)

    // AQUÍ VAN TUS COMANDOS
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0]
        if (!msg.message || msg.key.fromMe) return
        
        const from = msg.key.remoteJid
        const body = msg.message.conversation || 
                    msg.message.extendedTextMessage?.text || 
                    msg.message.imageMessage?.caption || ""
        
        const command = body.toLowerCase().trim()

        if (command === 'hola' || command === 'hola bot') {
            await sock.sendMessage(from, { text: 'Hola bro 🔥 Soy tu bot de WhatsApp' })
        }
        
        if (command === '!ping') {
            await sock.sendMessage(from, { text: 'Pong 🏓 Bot activo' })
        }
        
        if (command === '!menu') {
            const menu = `*🤖 MENU DEL BOT*\n\n` +
                        `*!ping* - Ver si estoy vivo\n` +
                        `*!menu* - Ver este menu\n` +
                        `*hola* - Saludo\n\n` +
                        `_Bot 24/7 en Railway_`
            await sock.sendMessage(from, { text: menu })
        }

        if (command === '!sticker' && msg.message.imageMessage) {
            await sock.sendMessage(from, { text: 'Función de sticker en desarrollo 😅' })
        }
    })
}

app.listen(port, () => {
    console.log(`Servidor iniciado en puerto ${port}`)
    console.log(`Escanea el QR en: /qr`)
    connectToWhatsApp()
})
