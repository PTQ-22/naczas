# API image (apps/api). Build from the repo root: docker build -t naczas-api .
# Runs the TypeScript sources with tsx — workspace packages (@naczas/shared, @naczas/rules)
# export raw TS, so there is no separate build step to keep in sync.

FROM node:22-slim AS deps
WORKDIR /app
RUN corepack enable
# Manifests first so the dependency layer is cached until a package.json or the lockfile changes.
# apps/mobile/package.json is needed only so the frozen lockfile matches the workspace.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/mobile/package.json apps/mobile/
COPY packages/shared/package.json packages/shared/
COPY packages/rules/package.json packages/rules/
RUN pnpm install --frozen-lockfile --filter "@naczas/api..."

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared packages/shared
COPY packages/rules packages/rules
COPY apps/api/package.json apps/api/
COPY apps/api/src apps/api/src
# Offline fallback + cache warm-up data (docs/05, WS2-5)
COPY apps/api/data apps/api/data
USER node
ENV PORT=8787
EXPOSE 8787
CMD ["node", "--import", "tsx", "apps/api/src/index.ts"]
