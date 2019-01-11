const LibPath = require('path');
const LibFs = require('fs');

const readdirSorted = require('readdir-sorted');
const Koa = require('koa');

const app = new Koa();

app.use(async ctx => {
  const baseDir = LibPath.join(__dirname, '..', 'history');

  const dirFiles = await readdirSorted(baseDir, {
    locale: 'en',
    numeric: true
  });

  let xml = '<rss></rss>';

  if (dirFiles.length > 0) {
    const lastFileName = dirFiles[dirFiles.length - 1];
    console.log(`XML serve: ${lastFileName}`);

    xml = LibFs.readFileSync(LibPath.join(baseDir, lastFileName)).toString();
  }

  ctx.response.type = 'xml';
  ctx.response.body = xml;
});

app.listen(3000);
console.log('Listening on port 3000');
