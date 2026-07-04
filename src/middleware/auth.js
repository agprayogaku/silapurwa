const basicAuth = require('express-basic-auth');

const adminAuth = basicAuth({
  users: {
    [process.env.ADMIN_PANEL_USERNAME]: process.env.ADMIN_PANEL_PASSWORD
  },
  challenge: true,        // memunculkan dialog login di browser
  realm: 'SILAPURWA Admin Panel'
});

module.exports = adminAuth;
