const axios = require('axios');

axios.get('https://api.ipify.org?format=json')
  .then(res => {
    console.log('🚀 Your Railway outbound IP is:', res.data.ip);
  })
  .catch(err => {
    console.error('❌ Error fetching IP:', err.message);
  });
