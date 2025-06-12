const fs = require('fs');
const path = require('path');
const readline = require('readline');

const uploadPath = path.join(__dirname, '../data/accounts.txt');

module.exports = async function handleBulkUpload(ctx) {
  if (!ctx.message || !ctx.message.document) {
    return ctx.reply('❌ Please send a .txt or .csv file containing your Nike accounts.');
  }

  const fileId = ctx.message.document.file_id;
  const fileLink = await ctx.telegram.getFileLink(fileId);
  const response = await fetch(fileLink.href);
  const text = await response.text();

  fs.writeFileSync(uploadPath, text, 'utf8');

  ctx.reply('✅ Accounts uploaded successfully. Would you like to test login now?');
};
