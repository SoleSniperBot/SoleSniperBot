// snkrsLogic.js
const axios = require('axios');

async function performSnkrsCheckout({ sku, proxy, profile, userId }) {
  if (!proxy || !sku || !profile) {
    throw new Error('Missing SKU, proxy, or profile');
  }

  const [ip, port, username, password] = proxy.split(':');
  const proxyConfig = {
    host: ip,
    port: parseInt(port),
    auth: { username, password },
    protocol: 'http'
  };

  const checkoutPayload = {
    sku,
    profile: {
      name: profile.name,
      email: profile.email || `solesniper+${userId}@gmail.com`,
      phone: profile.phone || '07123456789',
      address: {
        line1: profile.address1,
        line2: profile.address2 || '',
        city: profile.city,
        postcode: profile.postcode,
        country: profile.country || 'GB'
      },
      card: {
        number: profile.cardNumber,
        exp: profile.cardExp,
        cvv: profile.cardCvv
      },
      size: profile.shoeSize || 'UK 9',
      gender: profile.gender || 'male'
    },
    userId,
    timestamp: new Date().toISOString()
  };

  try {
    const response = await axios.post('https://api.nike.com/checkout', checkoutPayload, {
      proxy: proxyConfig,
      timeout: 15000,
      headers: {
        'User-Agent': 'Nike/255 CFNetwork/1390 Darwin/22.0.0',
        'x-nike-ux-id': 'com.nike.commerce.snkrs.ios',
        'x-nike-request-id': `SNKRS-${Date.now()}`,
        'x-platform': 'ios',
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200) {
      return {
        success: true,
        message: `✅ Checkout submitted for SKU ${sku}`
      };
    } else {
      throw new Error(`Status ${response.status}: ${response.statusText}`);
    }
  } catch (err) {
    console.error('❌ SNKRS Checkout Error:', err.message);
    throw new Error(`Checkout failed: ${err.message}`);
  }
}

module.exports = {
  performSnkrsCheckout
};
