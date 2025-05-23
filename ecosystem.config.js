module.exports = {
  apps: [
    {
      script: './dist/index.js',
      instances: '1',
      exec_mode: 'cluster',
      name: 'momentum-bot',
      env: {
        NODE_ENV: 'production',
      },
      env_dev: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
    {
      script: './dist/index.js',
      instances: '-1',
      exec_mode: 'cluster',
      name: 'replica',
      env: {
        NODE_ENV: 'production',
      },
      env_dev: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
}
