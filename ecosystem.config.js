module.exports = {
  apps: [{
    name: 'datacatalog',
    script: 'yarn',
    args: 'start',
    cwd: '/home/isocadm/datacatalog',
    env: {
      NODE_ENV: 'production',
    },
    // Clear cache before start
    pre_start: 'rm -rf .next/cache',
  }]
}
