FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev
RUN node -e "for (const name of ['@ffmpeg-installer/ffmpeg', '@ffprobe-installer/ffprobe']) require('node:fs').chmodSync(require(name).path, 0o755)"

COPY . .

ENV NODE_ENV=production
EXPOSE 5000
USER node

CMD ["node", "src/server.js"]
