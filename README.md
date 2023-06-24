## JS Engines playground

[![Gitpod ready-to-code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/gengjiawen/js-engines-playground)
[![Docker Pulls](https://img.shields.io/docker/pulls/gengjiawen/js-engines)](https://hub.docker.com/r/gengjiawen/js-engines)
![Docker Image Size (tag)](https://img.shields.io/docker/image-size/gengjiawen/js-engines/latest?label=latest)

## Playground
Not guarenteed online all the time

http://k2.gengjiawen.com:8001/

## Pre-request
You need v8 in your path, you can do similar like
```
npm i -g npm-check-updates esvu && yes | esvu
```
Or you can build v8 yourself. (see ref link if you want to setup v8 build env in one click)

Also add `~/.esvu/bin` to your path.

## Setup
```bash
pnpm i
pnpm dev
```

Frontend default port is http://localhost:3000

## Deploy
You can also use prebuild docker, 
```bash
docker run --rm -it --name js-engines -p8001:8000 gengjiawen/js-engines
```

or long running docker service:
```console
docker run -d --restart=always --name js-engines -p8001:8000 gengjiawen/js-engines:latest
```

## Todo
sandbox for engine execute script.

## Ref
* https://github.com/gengjiawen/v8-build
