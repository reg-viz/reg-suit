const Nightmare = require("nightmare");		
const nightmare = Nightmare({ show: false, width: 1500, height: 3400 });

const mkdirp = require("mkdirp");
mkdirp.sync(`${__dirname}/screenshot`);

nightmare
  .goto(`file://${__dirname}/dist/index.html`)
  .then(() => console.log("Open top page."))
  .then(() => nightmare.wait(100))
  .then(() => nightmare.screenshot(`${__dirname}/screenshot/index.png`))
  .then(() => console.log("Captured screenshot."))
  .then(() => nightmare.end())
  .catch(x => {
    console.error(x);
    process.exit(1);
  })
;
