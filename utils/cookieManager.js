const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');
const axios = require('axios');

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

module.exports = client;
