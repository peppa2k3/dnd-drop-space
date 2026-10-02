FROM node:20-bullseye-slim

# sharp and fluent-ffmpeg's screenshot generation need a couple of native
# libs present on the base image; installing them here avoids relying on
# postinstall scripts to fetch prebuilt binaries at build time.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "src/server.js"]
