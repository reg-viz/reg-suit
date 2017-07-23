const express = require("express");
const Nightmare = require("nightmare");		
const mkdirp = require("mkdirp");

const app = express();
const nightmare = Nightmare({ show: false, width: 1500, height: 3400 });

mkdirp.sync(`${__dirname}/screenshot`);
app.use(express.static("dist"))

const server = app.listen(3000, () => {
  nightmare
    .goto("http://localhost:3000")
    .then(() => console.log("Open top page."))
    .then(() => nightmare.wait(100))
    .then(() => nightmare.screenshot(`${__dirname}/screenshot/index.png`))
    .then(() => console.log("Captured screenshot."))
    .then(() => nightmare.end())
    .then(() => server.close())
    .catch(x => {
      console.error(x);
      process.exit(1);
    })
  ;
})
