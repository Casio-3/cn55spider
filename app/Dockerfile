FROM node:16

COPY ./sources.list /etc/apt/sources.list
RUN apt update

# install dependencies
RUN ["mkdir", "/install"]
ADD ["./src/package.json", "/install"]
WORKDIR /install
RUN npm --registry https://registry.npm.taobao.org install -y yarn
RUN yarn --registry https://registry.npm.taobao.org && \
    yarn global add pm2 --registry https://registry.npm.taobao.org
ENV NODE_PATH=/install/node_modules

# my flag
COPY flag /
WORKDIR /
RUN chmod 400 /flag-s && \
    gcc readflag-s.c -o readflag-s && \
    rm readflag-s.c && \
    chmod 4755 readflag-s && \
    mkdir /app && \
    mv /flag-m /app && chmod 744 /app/flag-m

COPY src /app
WORKDIR /app

EXPOSE 8082

USER 1000

CMD npm run $NPM_RUN_SCRIPT
