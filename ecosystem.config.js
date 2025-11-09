module.exports = {
  apps: [{
    name: 'weboost-backend',
    script: './backend/dist/index.js',
    cwd: __dirname,
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/backend-error.log',
    out_file: './logs/backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    // Redémarrer en cas d'erreur
    min_uptime: '10s',
    max_restarts: 10
  }]
};



