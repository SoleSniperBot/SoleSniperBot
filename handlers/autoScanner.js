const axios = require('axios');
const cheerio = require('cheerio');

let seenSKUs = new Set();

module.exports = async function autoScanner(bot) {
  try {
    const response = await axios.get('https://www.nike.com/gb/launch/upcoming');
    const html = response.data;
    const $ = cheerio.load(html);
    const drops = [];

    $('[data-testid="ProductCard"]').each((_, el) => {
      const name = $(el).find('[data-testid="ProductCard-title"]').text().trim();
      const subtitle = $(el).find('[data-testid="ProductCard-subtitle"]').text().trim();
      const url = 'https://www.nike.com' + $(el).find('a').attr('href');
      const skuMatch = url.match(/\/(\d{6}-\d{3})/);
      const sku = skuMatch ? skuMatch[1] : 'N/A';

      if (!seenSKUs.has(sku)) {
        seenSKUs.add(sku);
        drops.push({ name, subtitle, url, sku });
      }
    });

    if (drops.length > 0) {
      drops.forEach(drop => {
        const msg = `🚨 *New SNKRS Drop Alert!*\n*${drop.name}* – ${drop.subtitle}\nSKU: \`${drop.sku}\`\n[View on SNKRS](${drop.url})`;
        bot.telegram.sendMessage(process.env.ADMIN_CHAT_ID, msg, { parse_mode: 'Markdown' });
      });
    }
  } catch (error) {
    console.error('Auto-scanner error:', error.message);
  }
};
