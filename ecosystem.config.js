module.exports = {
  apps: [{
    name: 'silapurwa',
    script: 'app.js',
    watch: false,
    restart_delay: 5000,
    max_restarts: 10,
    min_uptime: '10s',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
