# Basislab Teksten – Node 22 (draait TypeScript direct, geen bouwstap)
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY public ./public
USER node
EXPOSE 8080
HEALTHCHECK CMD wget -qO- http://localhost:8080/gezond || exit 1
CMD ["node", "server/index.ts"]
