FROM node:20-alpine AS base
RUN npm install -g pnpm

WORKDIR /app
COPY pnpm-lock.yaml* pnpm-workspace.yaml package.json ./
COPY shared/ ./shared/
COPY services/registry-hub/ ./services/registry-hub/

RUN pnpm install --filter @clear/shared --filter @clear/registry-hub
RUN pnpm --filter @clear/shared run build
RUN pnpm --filter @clear/registry-hub run build

EXPOSE 3001
CMD ["pnpm", "--filter", "@clear/registry-hub", "run", "start"]
