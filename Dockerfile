# syntax=docker/dockerfile:1

FROM node:22-alpine AS build

WORKDIR /app

# 1) Install dependencies (workspaces only; skip repo-root devDeps like electron)
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci --workspaces --include-workspace-root=false

# 2) Build frontend
COPY backend ./backend
COPY frontend ./frontend
RUN npm run build --workspace frontend


FROM node:22-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

# Install production dependencies for workspaces (backend runtime deps)
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci --omit=dev --workspaces --include-workspace-root=false

# App sources
COPY backend/src ./backend/src
COPY --from=build /app/frontend/dist ./frontend/dist

ENV PORT=4000 \
    HOST=0.0.0.0 \
    SERVE_FRONTEND=1

EXPOSE 4000

CMD ["node", "backend/src/index.js"]
