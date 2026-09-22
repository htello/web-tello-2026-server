FROM node:22-alpine

# Prisma requiere openssl; bash no necesario (entrypoint POSIX sh)
RUN apk add --no-cache openssl

RUN npm install -g pnpm@9

WORKDIR /app

# Dependencias primero para aprovechar la caché de capas
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

# Código fuente y entrypoint
COPY src ./src
COPY docker-entrypoint.sh ./
RUN pnpm exec prisma generate \
  && chmod +x ./docker-entrypoint.sh \
  && chown -R node:node /app

ENV NODE_ENV=production
EXPOSE 3000

USER node

ENTRYPOINT ["./docker-entrypoint.sh"]
