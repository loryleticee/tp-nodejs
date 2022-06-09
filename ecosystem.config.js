module.exports = {
  apps : [{
    name: "aprex licence manager",
    script: "./server.js",
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
}
