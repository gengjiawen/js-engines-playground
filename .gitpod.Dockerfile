FROM gitpod/workspace-full:latest

ENV TRIGGER_REBUILD=4

ENV PATH=/usr/local/bin/:/home/gitpod/.esvu/bin:$PATH

ENV PATH="/home/linuxbrew/.linuxbrew/bin:/home/linuxbrew/.linuxbrew/sbin/:$PATH"

RUN npm i -g npm-check-updates esvu pnpm@8 && yes | esvu
