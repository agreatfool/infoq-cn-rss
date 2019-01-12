const LibPath = require('path');
const LibFs = require('fs');

const puppeteer = require('puppeteer');
const RSS = require('rss');
const moment = require('moment');
const readdirSorted = require('readdir-sorted');

let FEEDS = [];

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36');
  await page.goto('https://www.infoq.cn/');
  await page.setViewport({
    width: 1920,
    height: 1080
  });
  page.on('console', consoleObj => console.log(consoleObj.text()));

  try {

    await autoScroll(page);

    // await page.screenshot('d.png'); // dummy, without this, page elements would not be rendered

    FEEDS = await page.evaluate(() => {
      let items = document.querySelector('.recommond-wrapper .article-list .list');

      let feeds = [];

      for (let item of items.children) {
        if (item.classList.contains('feed-image')) {
          continue; // just a image, ignore it
        }

        let link = item.querySelector('.info .com-article-title');
        let url = link.href;
        let title = link.innerText;
        let description = item.querySelector('.info .summary').innerText;
        let timeDiff = item.querySelector('.info .extra .date').innerText;

        feeds.push({
          title,
          url,
          description,
          date: timeDiff,
        });
      }

      return feeds;
    });

    await cleanHistory();
    handleDate();
    generateRss();

  } catch (e) {
    // possible throw error: "Evaluation failed: TypeError: Cannot read property 'children' of null"
    // handle it here, otherwise the node process would be hung
    console.log(e);
  }

  await browser.close();
})();

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      let distance = 100;
      let timer = setInterval(() => {
        let scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

async function cleanHistory() {
  const baseDir = LibPath.join(__dirname, '..', 'history');
  const dirFiles = await readdirSorted(baseDir, {
    locale: 'en',
    numeric: true
  });

  const CLEAN_EDGE = 200;

  if (dirFiles.length <= CLEAN_EDGE) {
    return; // no need to clean
  }

  let loop = 1;
  for (const file of dirFiles) {
    if (loop >= CLEAN_EDGE) {
      break; // enough
    }
    LibFs.unlinkSync(LibPath.join(baseDir, file));
    loop++;
  }
}

function handleDate() {
  if (FEEDS.length === 0) {
    return; // nothing to handle
  }

  const patternNow = new RegExp(/^刚刚$/g);
  const patternMinute = new RegExp(/^\d+\s分钟前$/g);
  const patternHour = new RegExp(/^\d+\s小时前$/g);
  const patternDate = new RegExp(/^\d+\s年\s\d+\s月\s\d+\s日$/g);

  FEEDS.forEach((item, index) => {
    let date = null;
    let timeDiff = item.date;

    if (timeDiff.match(patternNow) !== null) {
      date = moment().utc().utcOffset(8).format();
    } else if (timeDiff.match(patternMinute) !== null) {
      date = moment().utc().utcOffset(8).subtract(timeDiff.match(/\d+/g)[0], 'minutes').format();
    } else if (timeDiff.match(patternHour) !== null) {
      date = moment().utc().utcOffset(8).subtract(timeDiff.match(/\d+/g)[0], 'hours').format();
    } else if (timeDiff.match(patternDate) !== null) {
      const nums = timeDiff.match(/\d+/g);

      let year = nums[0];
      let month = nums[1];
      let day = nums[2];

      if (month < 10) {
        month = '0' + month;
      }
      if (day < 10) {
        day = '0' + day;
      }

      date = moment(`${year}-${month}-${day}`).utc().utcOffset(8).format();
    }

    FEEDS[index].date = date;
  });
}

function generateRss() {
  if (FEEDS.length === 0) {
    return; // nothing to generate
  }

  let feed = new RSS({
    title: 'InfoQ - 促进软件开发领域知识与创新的传播',
    site_url: 'https://infoq.cn',
    description: 'InfoQ 是一个实践驱动的社区资讯站点，致力于促进软件开发领域知识与创新的传播。',
  });

  FEEDS.forEach((item) => {
    feed.item({
      title: item.title,
      url: item.url,
      description: item.description,
      date: item.date,
    });
  });

  const feedDest = LibPath.join(__dirname, '..', 'history', `infoq_cn_feed_${moment().format('YYYY-MM-DD_HHmmss_SSSS')}.xml`);
  LibFs.writeFileSync(feedDest, feed.xml());

  console.log(`Feeds[${FEEDS.length}] xml dumped: ${feedDest}`);
}