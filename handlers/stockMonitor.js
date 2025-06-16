const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const calendarPath = path.join(__dirname, '../data/calendar.json');

let interval = null;

module.exports = (bot) => {
  // === Start Stock Monitoring Loop ===
  async function checkStockLoop() {
    if (!fs.existsSync(calendarPath)) return;

    const calendar = JSON.parse(fs.readFileSync(calendarPath));
    if (!Array.isArray(calendar)) return;

    for (const drop of calendar) {
      try {
        const res = await fetch(`https://api.nike.com/product_feed/threads/v2?filter=marketplace(GB)&filter=language(en-GB)&filter=productInfo.merchProduct.styleColor(${drop.sku})`);
        const json = await res.json();
        if (!json.objects || json.objects.length === 0) continue;

        const product = json.objects[0];
        const stockStatus = product.productInfo?.[0]?.availability?.available;
        const title = product.productInfo?.[0]?.productContent?.title || drop.name;
        const link = `https://www.nike.com/gb/t/${title.toLowerCase().replace(/\s+/g, '-')}-${drop.sku.toLowerCase()}`;

        if (stockStatus) {
          // ✅ Telegram Alert
          await bot.telegram.sendMessage(
            process.env.ADMIN_CHAT_ID, // your Telegram ID or broadcast group
            `🚨 *IN STOCK*\n\n👟 ${title}\nSKU: \`${drop.sku}\`\n🔗 [Buy Now](${link})`,
            { parse_mode: 'Markdown', disable_web_page_preview: false }
          );

          // ✅ Optional Discord Webhook
          if (process.env.DISCORD_WEBHOOK_URL) {
            await fetch(process.env.DISCORD_WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content: `🚨 **IN STOCK**\n**${title}**\nSKU: ${drop.sku}\n🔗 ${link}`
              })
            });
          }
        }

      } catch (err) {
        console.error(`❌ Error checking stock for ${drop.sku}:`, err.message);
      }
    }
  }

  // Interval (runs every 60s)
  if (!interval) {
    interval = setInterval(checkStockLoop, 60000);
    console.log('✅ Stock monitoring loop started...');
  }
};
