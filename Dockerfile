# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:24-alpine AS builder
 
WORKDIR /app
 
COPY package*.json ./
RUN npm ci
 
COPY . .
RUN npm run build
 
# ── Stage 2: Production ─────────────────────────────────────────
FROM node:24-alpine AS production
 
WORKDIR /app
 
# Only copy production dependencies
COPY package*.json ./
RUN npm ci --only=production
 
# Copy compiled output
COPY --from=builder /app/dist ./dist
 
# Copy seed script (needs ts-node at runtime for seeding)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY tsconfig.json ./
 
EXPOSE 3000
 
CMD ["node", "dist/main"]
