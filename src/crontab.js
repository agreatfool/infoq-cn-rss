const LibPath = require('path');

const moment = require('moment');
const cron = require('node-cron');
const shell = require('shelljs');

const crawlerPath = LibPath.join(__dirname, 'crawler.js');

cron.schedule('* * * * *', () => {
  console.log(`start crawling ${moment().format()} ...`);
  shell.exec(`node ${crawlerPath}`);
});