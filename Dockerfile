# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Build the app
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built files and necessary configs
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/resources ./dist/resources

# Add tini
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget --quiet --tries=1 --spider http://localhost:8000/health || exit 1

# Set environment
ENV NODE_ENV=production

EXPOSE 8080
CMD ["node", "dist/index.js"]
