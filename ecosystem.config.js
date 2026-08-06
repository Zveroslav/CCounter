module.exports = {
  apps: [
    {
      name: "ccounter-app",
      script: "apps/server/dist/index.js",
      env: {
        NODE_ENV: "production",
      },
    }
  ]
};
