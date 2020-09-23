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
const dbFile = "./.data/sqlite.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(dbFile);

// if ./.data/sqlite.db does not exist, create it, otherwise print records to console
db.serialize(() => {
  if (!exists) {
    db.run(
      "CREATE TABLE Kicker (id INTEGER PRIMARY KEY AUTOINCREMENT, title text,image text,story text,date text)"
    );

    console.log("New table Kicker created!");

    // insert default dreams
    db.serialize(() => {
      db.run(
        'INSERT INTO Kicker(title, image, story, date) VALUES ("foo", "baa", "caa", "1234")'
      );
    });
  } else {
    console.log('Database "Kicker" ready to go!');
    db.each("SELECT * from Kicker", (err, row) => {
      if (row) {
        console.log(`record: ${row.dream}`);
      }
    });
  }
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
  return res.json(stuff);
});

// endpoint to get all the dreams in the database
app.get("/getDreams", (request, response) => {
  db.all("SELECT * from Dreams", (err, rows) => {
    response.send(JSON.stringify(rows));
  });
});

// endpoint to add a dream to the database
app.post("/addDream", (request, response) => {
  console.log(`add to dreams ${request.body.dream}`);

  // DISALLOW_WRITE is an ENV variable that gets reset for new projects
  // so they can write to the database
  if (!process.env.DISALLOW_WRITE) {
    const cleansedDream = cleanseString(request.body.dream);
    db.run(`INSERT INTO Dreams (dream) VALUES (?)`, cleansedDream, error => {
      if (error) {
        response.send({ message: "error!" });
      } else {
        response.send({ message: "success" });
      }
    });
  }
});

// endpoint to clear dreams from the database
app.get("/clearDreams", (request, response) => {
  // DISALLOW_WRITE is an ENV variable that gets reset for new projects so you can write to the database
  if (!process.env.DISALLOW_WRITE) {
    db.each(
      "SELECT * from Dreams",
      (err, row) => {
        console.log("row", row);
        db.run(`DELETE FROM Dreams WHERE ID=?`, row.id, error => {
          if (row) {
            console.log(`deleted row ${row.id}`);
          }
        });
      },
      err => {
        if (err) {
          response.send({ message: "error!" });
        } else {
          response.send({ message: "success" });
        }
      }
    );
  }
});

// helper function that prevents html/css/script malice
const cleanseString = function(string) {
  return string.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

// listen for requests :)
var listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});
