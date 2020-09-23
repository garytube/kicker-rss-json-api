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

// we've started you off with Express,
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public")); 

// init sqlite db
const dbFile = "./base.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(dbFile);

// if ./.data/sqlite.db does not exist, create it, otherwise print records to console
const sql_create = `CREATE TABLE IF NOT EXISTS Books (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  Title VARCHAR(100) NOT NULL,
  Image VARCHAR(100) NOT NULL,
  Story TEXT,
  Publish TEXT
);`; 

db.run(sql_create, err => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Successful creation of the 'Books' table");
});

// http://expressjs.com/en/starter/basic-routing.html
app.get("/d", (request, response) => {
  response.sendFile(`${__dirname}/views/index.html`);
});

app.get("/", async (req, res) => {
  let feed = await parser.parseURL("https://rss.kicker.de/news/aktuell");
  const articels = await feed.items.filter(post =>
    post.link.includes("artikel")
  );
  // const preview = await lp.getLinkPreview(articels[0].link)
  // return res.json({foo:articels[0]})

  const stuff = await Promise.all(
    articels.slice(0, 3).map(async post => {
      const { title, images } = await lp.getLinkPreview(post.link);

      return {
        title,
        image: images[0],
        story: post.content,
        date: post.isoDate
      };
    })
  );
  const sql_insert = `INSERT INTO Kicker (Title, Image, Story, Publish ) VALUES(?, ?, ?, ?)`
  return res.json(stuff);
});

// endpoint to get all the dreams in the database
app.get("/getDreams", (request, response) => {
  db.all("SELECT * from Dreams", (err, rows) => {
    response.send(JSON.stringify(rows));
  });
});


// listen for requests :)
var listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});
