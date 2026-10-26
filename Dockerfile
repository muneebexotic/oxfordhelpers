# syntax=docker/dockerfile:1

# ---- Build: install everything, generate static pages, OG images and the server bundle ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Build-time settings are baked into the static pages (see site.config.mjs).
ARG SITE_DOMAIN
ARG BRAND_NAME
ARG CONTACT_EMAIL
ARG CONTACT_WHATSAPP
ARG CONTACT_PHONE
ARG CONTACT_HOURS
ARG REPLY_TARGET
ARG BUSINESS_LEGAL_NAME
ARG BUSINESS_COMPANY_NUMBER
ARG BUSINESS_ADDRESS
ARG BUSINESS_ICO_NUMBER
ARG SOCIAL_INSTAGRAM
ARG SOCIAL_LINKEDIN
ARG SOCIAL_FACEBOOK
ARG GOOGLE_SITE_VERIFICATION
ARG BING_SITE_VERIFICATION
ARG RETENTION_DAYS
RUN npm run build

# ---- Runtime: production dependencies + built output only ----
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4321 \
    DATABASE_PATH=/app/data/leads.sqlite
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
RUN mkdir -p /app/data && chown -R node:node /app/data
USER node
VOLUME ["/app/data"]
EXPOSE 4321
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:4321/robots.txt >/dev/null || exit 1
CMD ["node", "--disable-warning=ExperimentalWarning", "dist/server/entry.mjs"]
