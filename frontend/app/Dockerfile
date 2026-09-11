FROM node:20-alpine AS base
RUN npm install -g pnpm

WORKDIR /app
COPY pnpm-lock.yaml* pnpm-workspace.yaml package.json ./
COPY shared/ ./shared/
COPY frontend/app/ ./frontend/app/

RUN pnpm install --filter @clear/shared --filter @clear/frontend-app
RUN pnpm --filter @clear/shared run build
RUN pnpm --filter @clear/frontend-app run build

EXPOSE 3000
CMD ["pnpm", "--filter", "@clear/frontend-app", "run", "preview", "--host", "0.0.0.0", "--port", "3000"]
