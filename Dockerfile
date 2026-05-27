# build client
FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# runtime: express serves built client + api + data
FROM node:20-bookworm-slim AS product
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY --from=builder /app/dist ./dist
ENV DATA_DIR=/app/data
EXPOSE 8000
CMD ["node", "server/index.js"]
