module.exports = {
  apps: [
    {
      name: "findx-backend",
      cwd: "./backend",
      script: "./.venv/bin/uvicorn",
      args: "main:app --host 127.0.0.1 --port 8006",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
    {
      name: "findx-frontend",
      cwd: "./frontend",
      script: "./node_modules/.bin/next",
      args: "start -p 3006",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: "3006",
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
