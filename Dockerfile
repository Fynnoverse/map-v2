FROM node:24-alpine AS build
WORKDIR /app
RUN npm install --global pnpm@10.25.0
COPY . .
RUN pnpm install --frozen-lockfile
ENV NEXT_PUBLIC_EDR_API_URL=/api
ENV NEXT_PUBLIC_ROUTING_URL=/routing
RUN pnpm --dir packages/map build

FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/map/dist /usr/share/nginx/html
EXPOSE 80
