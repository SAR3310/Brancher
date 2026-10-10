# Brancher - siap deploy ke Railway/Render/Fly/VPS mana pun
FROM node:22-alpine

WORKDIR /app

# Install dependency server & client, lalu build client React
COPY package.json ./
COPY client/package.json ./client/
RUN npm install --omit=dev --ignore-scripts && cd client && npm install

COPY . .
RUN cd client && npm run build

ENV NODE_ENV=production
ENV DATA_DIR=/data
EXPOSE 3000

# Mount volume ke /data agar database & upload tidak hilang saat redeploy
VOLUME ["/data"]

CMD ["node", "server/index.js"]
