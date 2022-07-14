FROM node:lts-alpine as fe
RUN npm i -g pnpm 
WORKDIR /app

COPY package.json /app
COPY .npmrc /app
COPY pnpm-lock.yaml /app
COPY pnpm-workspace.yaml /app
COPY frontends/package.json /app/frontends/package.json
RUN pnpm i 

COPY ./frontends /app/frontends
RUN cd /app/frontends && pnpm build
