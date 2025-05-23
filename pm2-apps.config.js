// PM2 ecosystem file for Data Dashboard project
// Run all servers (backend, frontend, electron) with one command
module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: './backend-nodejs',
      script: 'server.js',
      interpreter: 'node',
      watch: false,
      env: {
        NODE_ENV: 'development',
        PORT: 8082
      }
    },
    {
      name: 'frontend',
      cwd: './frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'dev',
      interpreter: 'node',
      watch: false,
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      }
    },
    {
      name: 'electron',
      cwd: './electron-app',
      script: process.platform === 'win32'
        ? './node_modules/.bin/electron.cmd'
        : './node_modules/.bin/electron',
      args: '.',
      interpreter: 'none',
      watch: false,
      env: {
        NODE_ENV: 'development'
      }
    }
  ]
};
