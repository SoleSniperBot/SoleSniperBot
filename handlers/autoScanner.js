const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const scannedPath = path.join(__dirname, '../data/scanned.json');
if (!fs.existsSync(scannedPath)) fs.writeFileSync(scannedPath, '[]');

const getScannedSKUs = () => JSON.parse(fs.readFileSync(scannedPath, 'utf-8'));
const saveScannedSKUs = (skus) => fs.writeFileSync(scannedPath, JSON.stringify(skus.slice(-500), null, 2)); // keep only latest 500

module.exports = (bot) => {
  const scanSNKRS = async () => {
    try {
      const url = 'https://www.nike.com/gb/launch';
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SoleSniperBot/1.0)',
          'Accept-Language': 'en-GB,en;q=0.9'
        }
      });

      const $ = cheerio.load(response.data);
      const found = [];

      $('.product-card').each((i, el) => {
        const name = $(el).find('.headline-5').text().trim();
        const subtitle = $(el).find('.headline-4').text().trim();
        const link = $(el).find('a').attr('href');
        const date = $(el).find('.available-date-component').text().trim();

        const skuMatch = link && link.match(/\/launch\/t\/([\w-]+)/);
        const sku = skuMatch ? skuMatch[1].toUpperCase() : null;

        if (name && sku && !name.toLowerCase().includes('custom')) {
          found.push({
            name: `${name} ${subtitle}`.trim(),
            sku,
            date,
            link: 'https://www.nike.com' + link
          });
        }
      });

      const scanned = getScannedSKUs();
      const newDrops = found.filter(d => !scanned.includes(d.sku));

      if (newDrops.length) {
        newDrops.forEach(drop => {
          const msg = `🔥 *New SNKRS Drop Detected!*\n\n👟 *${drop.name}*\n🆔 SKU: \`${drop.sku}\`\n📆 Release: ${drop.date}\n🔗 [View Drop](${drop.link})`;
          bot.telegram.sendMessage(process.env.OWNER_ID, msg, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true
          });
        });

        const updated = [...scanned, ...newDrops.map(d => d.sku)];
        saveScannedSKUs(updated);
      }
    } catch (err) {
      console.error('❌ SNKRS scan error:', err.message);
      try {
        bot.telegram.sendMessage(process.env.OWNER_ID, `⚠️ SNKRS scan failed: ${err.message}`);
      } catch (_) {}
    }
  };

  // Run every 5 minutes
  setInterval(scanSNKRS, 5 * 60 * 1000);
  scanSNKRS(); // Run once on startup
};
