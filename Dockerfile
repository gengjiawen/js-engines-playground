FROM node:lts-alpine as fe
RUN npm i -g pnpm 
WORKDIR /app

COPY package.json /app
COPY .npmrc /app
COPY pnpm-lock.yaml /app
COPY pnpm-workspace.yaml /app
COPY frontend/package.json /app/frontend/package.json
COPY backend/package.json /app/backend/package.json
RUN pnpm i 

COPY ./ /app/
RUN pnpm build

RUN cp -r /app/frontend/dist/ /app/backend/build/

CMD ["node", "/app/backend/build/index.js"]