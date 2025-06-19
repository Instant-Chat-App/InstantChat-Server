#==========STAGE 1: BUILD==========
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

#==========STAGE 2: PRODUCTION==========
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/resources ./dist/resources

HEALTHCHECK --interval=30s --timeout=3s CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1
ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "dist/index.js"]
