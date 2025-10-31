module.exports = {
  apps: [
    {
      name: 'backend',
      script: 'server.js',      // ton fichier Express principal
      watch: true,
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    },
    {
      name: 'frontend',
      script: 'frontend-start.js',
      cwd: './src',         // chemin vers ton projet React
      watch: false,
      env: {
        NODE_ENV: 'development',
        PORT: 82
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 82
      }
    }
  ]
};
