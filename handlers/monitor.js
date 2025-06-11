const fs = require('fs');
const axios = require("axios");
const path = require("path");

const historyPath = path.join(__dirname, "../Data/SkuHistory.json");
if (!fs.existsSync(historyPath)) fs.writeFileSync(historyPath, JSON.stringify([]));

async function fetchSNKRSProducts() {
  const response = await axios.get("https://api.nike.com/product_feed/threads/v2?filter=marketplace%28GB%29&filter=language%28en-GB%29&filter=upcoming%28true%29&count=50");
  return response.data.objects || [];
}

async function sendTelegramAlert(bot, chatId, product) {
  const { title, publishedContent, id } = product;
  const sku = product?.productInfo?.[0]?.merchProduct?.styleColor || "Unknown";
  const launchDate = product?.productInfo?.[0]?.launchView?.startEntryDate || "N/A";
  const image = publishedContent?.nodes?.[0]?.properties?.squarishURL || null;
  const link = `https://www.nike.com/gb/launch/t/${title.replace(/\s+/g, "-").toLowerCase()}/${sku}`;

  const message = `🚨 *New SNKRS Drop Detected!*\n\n👟 *${title}*\n🆔 *SKU:* ${sku}\n📆 *Launch:* ${launchDate.split("T")[0]}\n🔗 [View Drop](${link})`;

  if (image) {
    await bot.sendPhoto(chatId, image, { caption: message, parse_mode: "Markdown" });
  } else {
    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  }
}

module.exports = async function monitor(bot) {
  const chatId = process.env.ADMIN_CHAT_ID; // Replace with your Telegram ID or use VIP list
  const seen = JSON.parse(fs.readFileSync(historyPath));

  const products = await fetchSNKRSProducts();

  for (const product of products) {
    const sku = product?.productInfo?.[0]?.merchProduct?.styleColor;
    if (!sku || seen.includes(sku)) continue;

    // Save new SKU
    seen.push(sku);
    fs.writeFileSync(historyPath, JSON.stringify(seen, null, 2));

    // Send alert
    await sendTelegramAlert(bot, chatId, product);
  }
};
