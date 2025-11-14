FROM docker.io/library/node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci --no-audit --no-fund || npm i --no-audit --no-fund


COPY . .


ARG VITE_API_BASE=/api
ENV VITE_API_BASE=${VITE_API_BASE}


RUN npm run build
RUN ls -la && echo "---- dist ----" && ls -la dist || true


FROM docker.io/library/nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]