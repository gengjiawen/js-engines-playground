FROM gitpod/workspace-full:latest

ENV TRIGGER_REBUILD=5

ENV PATH=/usr/local/bin/:/home/gitpod/.jsvu/bin:$PATH

ENV PATH="/home/linuxbrew/.linuxbrew/bin:/home/linuxbrew/.linuxbrew/sbin/:$PATH"

RUN npm i -g npm-check-updates jsvu pnpm@8 && yes | jsvu
