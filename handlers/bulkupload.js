const fs = require('fs');
const path = require('path');
const readline = require('readline');

const uploadDir = path.join(__dirname, '../Data/Profiles.json');

function parseLine(line) {
    // Expected format: email:password:proxy (proxy is optional)
    const parts = line.split(':');
    if (parts.length < 2) return null;
    
    const [email, password, proxy] = parts;
    return {
        email: email.trim(),
        password: password.trim(),
        proxy: proxy ? proxy.trim() : null
    };
}

async function handleBulkUpload(ctx) {
    if (!ctx.message.document) {
        return ctx.reply('❌ Please send a .txt or .csv file with accounts in this format:\n\n`email:password:proxy`');
    }

    const fileId = ctx.message.document.file_id;
    const fileLink = await ctx.telegram.getFileLink(fileId);
    
    const res = await fetch(fileLink.href);
    const text = await res.text();

    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    const parsedAccounts = lines.map(parseLine).filter(Boolean);

    if (parsedAccounts.length === 0) {
        return ctx.reply('❌ No valid lines found in file. Ensure each line is like:\n`email:password:proxy`');
    }

    // Read existing profiles
    let profiles = [];
    try {
        profiles = JSON.parse(fs.readFileSync(uploadDir, 'utf8'));
    } catch (e) {
        console.error('Failed to read existing profiles:', e.message);
    }

    profiles.push(...parsedAccounts);

    // Save updated
    fs.writeFileSync(uploadDir, JSON.stringify(profiles, null, 2));
    return ctx.reply(`✅ Uploaded ${parsedAccounts.length} accounts successfully.`);
}

module.exports = handleBulkUpload;
