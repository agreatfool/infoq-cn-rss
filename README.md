# infoq-cn-rss

## Install
### Node
```bash
nvm install v8.11.1
```

### Pm2
```bash
npm install pm2 -g
```

### Clone source
```bash
git clone https://github.com/agreatfool/infoq-cn-rss.git
cd infoq-cn-rss
```

### Web
```bash
pm2 start src/web.js
#pm2 ls
#pm2 show $ID
#pm2 logs web
```

### Crontab
```bash
pm2 start src/crontab.js
#pm2 ls
#pm2 show $ID
#pm2 logs crontab
```

### Nginx
```nginx
upstream web{
    server 127.0.0.1:3000;
    keepalive 64;
}
server {
    listen       80;
    server_name  infoq.xenojoshua.com;

    access_log  /var/log/nginx/infoq.access.log;
    error_log   /var/log/nginx/infoq.error.log;

    location / {
        proxy_read_timeout 300;
        proxy_pass http://web;
        proxy_set_header Host $http_host;
    }

    error_page  404  /404.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
        proxy_set_header Host $http_host;
    }
}
```
start nginx

## Appendix
### Error "Failed to launch chrome! error while loading shared libraries: libX11-xcb.so"

> apt-get install gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

### Error "Error: Failed to launch chrome! Running as root without --no-sandbox is not supported. See https://crbug.com/638180."

See [troubleshooting.md](https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#setting-up-chrome-linux-sandbox).