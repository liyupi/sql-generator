FROM node:18-buster-slim as builder

COPY package.json ./

RUN npm install && mkdir /app && mv ./node_modules /app

WORKDIR /app

COPY . .

RUN npm run build

FROM nginx:1.21.6-alpine AS runtime-image

COPY nginx/default.conf /etc/nginx/conf.d/

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]