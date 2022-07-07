FROM gitpod/workspace-full:latest

ENV TRIGGER_REBUILD=3

RUN rm -rf ~/.nvm && brew install n && sudo /home/linuxbrew/.linuxbrew/bin/n latest && sudo /usr/local/bin/npm i -g yarn pnpm
ENV PATH=/usr/local/bin/:/home/gitpod/.esvu/bin:$PATH

ENV PATH="/home/linuxbrew/.linuxbrew/bin:/home/linuxbrew/.linuxbrew/sbin/:$PATH"

RUN sudo npm i -g npm-check-updates esvu && yes | esvu
RUN sudo yarn global add gengjiawen/envinfo

USER root
# share env see https://github.com/gitpod-io/workspace-images/issues/472, `sudo su` to switch to root
RUN echo "PATH="${PATH}"" | sudo tee /etc/environment
