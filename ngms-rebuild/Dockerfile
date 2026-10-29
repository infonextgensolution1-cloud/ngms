# NGMS rebuild: standard Node.js runtime for Coolify / Docker hosting.
# Build from the ngms-rebuild/ directory so its package-lock.json is used.
FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_NGMS_API_BASE=https://ngms-admin-api-preview.nextgensolarcleaningmaintenancesolutions.workers.dev
ARG NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES=false
ENV NEXT_PUBLIC_NGMS_API_BASE=$NEXT_PUBLIC_NGMS_API_BASE
ENV NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES=$NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES
RUN npm run build

FROM base AS production-dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npm", "run", "start"]
