# Multi-stage build: frontend + backend

# 1) Frontend build
FROM node:20-alpine AS frontend-build
WORKDIR /app
# Copy manifest and install deps (lockfile optional)
COPY package.json ./
RUN npm ci || npm install
COPY . .
# Build frontend bundle into /app/dist
RUN npm run build

# 2) Backend build
FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package.json ./
RUN npm ci || npm install
COPY backend ./
RUN npm run build

# 3) Production image
FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /srv/app
# app files
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/package.json ./backend/package.json
COPY --from=frontend-build /app/dist ./dist
# install prod deps for backend only
WORKDIR /srv/app/backend
RUN npm install --omit=dev && npm cache clean --force
WORKDIR /srv/app
# Allow overriding DB_FILE path; default to /data/db.json
ENV DB_FILE=/data/db.json
# Create data dir
RUN mkdir -p /data && chown -R node:node /data && mkdir -p /srv/app/backend && chown -R node:node /srv/app
USER node
EXPOSE 4001
CMD ["node", "backend/dist/index.js"]
