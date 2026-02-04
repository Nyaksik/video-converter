FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN corepack enable pnpm && pnpm install --frozen-lockfile

COPY . .

ARG PUBLIC_SITE_URL
ARG PUBLIC_SITE_NAME
ARG PUBLIC_INFO_EMAIL
ARG PUBLIC_METRIKA

ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL
ENV PUBLIC_SITE_NAME=$PUBLIC_SITE_NAME
ENV PUBLIC_INFO_EMAIL=$PUBLIC_INFO_EMAIL
ENV PUBLIC_METRIKA=$PUBLIC_METRIKA

RUN pnpm build

FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]