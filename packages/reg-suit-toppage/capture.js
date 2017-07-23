const Nightmare = require("nightmare");
const nightmare = Nightmare({ show: false, width: 1200, height: 300, webPreferences: {
  nodeIntegration: true,
  preload: `${__dirname}/preload.js`,
}});

const mkdirp = require("mkdirp");
mkdirp.sync(`${__dirname}/screenshot`);

nightmare
  .goto(`file://${__dirname}/dist/index.html`)
  .wait(500)
  .evaluate(() => win.setSize(1200, 3300))
  .wait(100)
  .screenshot(`${__dirname}/screenshot/index.png`)
  .end()
  .then(() => {
    console.log("Captured screenshot")
  })
  .catch(x => {
    console.error(x);
    process.exit(1);
  })
;
