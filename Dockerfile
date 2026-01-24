FROM node:lts as builder

RUN npm i -g pnpm
# ignore some engines install error
RUN npm i -g jsvu && yes | jsvu || true

WORKDIR /app

COPY package.json /app/
COPY pnpm-lock.yaml /app/
ENV HUSKY=0
RUN pnpm i --no-frozen-lockfile

COPY ./ /app/
RUN mkdir -p /app/public
RUN pnpm build

# Ensure `qjs` exists in PATH (some environments don't install it via jsvu).
ENV PATH=/root/.jsvu/bin:${PATH}
RUN pnpx @gengjiawen/unzip-url "https://bellard.org/quickjs/binary_releases/quickjs-linux-x86_64-2025-09-13.zip" /tmp && mv /tmp/qjs /root/.jsvu/bin/qjs || true

FROM node:lts as runner

ENV NODE_ENV=production
ENV PORT=8000
ENV HOSTNAME=0.0.0.0

WORKDIR /app

COPY --from=builder /root/.jsvu /root/.jsvu
ENV PATH=/root/.jsvu/bin:${PATH}

# Local qjs-debug binary shipped in repo; injected into PATH at runtime by ensureEnginePath().
COPY --from=builder /app/binary /app/binary

# Next.js standalone output
COPY --from=builder /app/.next/standalone /app/
COPY --from=builder /app/.next/static /app/.next/static
COPY --from=builder /app/public /app/public

EXPOSE 8000

CMD ["node", "server.js"]
