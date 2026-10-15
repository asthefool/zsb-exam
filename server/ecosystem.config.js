// pm2 进程守护配置：npm i -g pm2 && pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'zsb-exam-server',
      script: 'src/app.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
