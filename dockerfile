from node:18-alpine

LABEL maintainer="IITII <ccmejx@gmail.com>"

ENV MINI_MODE copy
ENV MINI_INPUT /mini/tmp
ENV MINI_CACHE ''
ENV MINI_CPU ''
ENV MINI_MAX_DEPTH 3
ENV MINI_SKIP_IF_LARGE true
ENV DEBUG info

ADD . /mini
WORKDIR /mini
volume ["/mini/tmp", "/mini/pic_minify_cache"]

RUN npm i

CMD ["npm", "start"]