// server.js
// where your node app starts

// init project
const express = require("express");
const bodyParser = require("body-parser");
const lp = require("link-preview-js");
let Parser = require("rss-parser");
var morgan = require("morgan");
const app = express();
const fs = require("fs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan("dev"));
let parser = new Parser();

app.get("/", async (req, res) => {
  let feed = await parser.parseURL("https://rss.kicker.de/news/aktuell");
  const articels = await feed.items.filter(post =>
    post.link.includes("artikel")
  );


  const stuff = await Promise.all(
    articels.slice(0, 3).map(async post => {
      const { title, images } = await lp.getLinkPreview(post.link);
      return {title, image:images[0], content:post.content, date:post.isoDate}
    })
  );

  return res.json(stuff);
});


// listen for requests :)
var listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});
