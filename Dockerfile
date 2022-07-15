FROM node:lts-alpine as fe
RUN npm i -g pnpm 
WORKDIR /app

COPY package.json /app
COPY .npmrc /app
COPY pnpm-lock.yaml /app
COPY pnpm-workspace.yaml /app
COPY frontend/package.json /app/frontend/package.json
RUN pnpm i 

COPY ./frontend /app/frontend
RUN cd /app/frontend && pnpm build
