module.exports = {
  apps: [{
    name: 'weboost-backend',
    script: './backend/dist/index.js',
    cwd: '/var/www/weboost',
    instances: 1,
    exec_mode: 'fork',
    env_file: './backend/.env',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/weboost/error.log',
    out_file: '/var/log/weboost/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads']
  }]
};
