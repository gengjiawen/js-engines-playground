FROM node:lts as fe
RUN npm i -g pnpm 
# ignore some engines install error
RUN npm i -g esvu && yes | esvu || true

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

ENV PATH=/root/.esvu/bin:${PATH}
RUN which v8

CMD ["node", "/app/backend/build/index.js"]

EXPOSE 8000
