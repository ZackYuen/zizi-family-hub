const os = require("os");
const path = require("path");

module.exports = {
  apps: [
    {
      name: "zizi-whatsapp-bot",
      cwd: __dirname,
      script: "src/index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
        // Keep session under the pm2 user's home (avoids root-owned ./auth_info)
        AUTH_DIR: path.join(os.homedir(), ".zizi-whatsapp-auth"),
      },
    },
  ],
};
