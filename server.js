var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));


// If deployed, use the deployed DB, else use the local srappyNews DB.
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/scrappyNews";
// Connect to the Mongo DB
mongoose.connect(MONGODB_URI);



// Routes

// A GET route for scraping the echoJS website
app.get("/scrape", function (req, res) {
  // First, we grab the body of the html with axios
  axios.get("https://navajotimes.com/").then(function (response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("div.main-post").each(function (i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this).find(".header").children("a").attr("title");
      result.link = $(this).find(".header").children("a").attr("href");
      result.summary = $(this).find(".excerpt").children("p").text().trim();
      result.date_updated = $(this).find(".updated").text().trim();

      //console.log(result);

      // Create a new Article using the `result` object built from scraping
      db.Story.create(result)
        .then(function (dbStory) {
          // View the added result in the console
          console.log(dbStory);
        })
        .catch(function (err) {
          // If an error occurred, log it
          console.log(err);
        });
    });

    // Send a message to the client
    res.send("Scrape Complete");
  });
});


// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // Grab every document in the Articles collection
  db.Story.find({})
    .then(function(dbStory) {
      // If we were able to successfully find Articles, send them back to the client
      console.log("after find all: " + dbStory);
      res.json(dbStory);
      //DO A RES.RENDER HERE
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});


// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  //console.log(req.params.id);

  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Story.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("comment")
    .then(function(dbStory) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbStory);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Comment
app.post("/articles/:id", function(req, res) {
  // Create a new comment and pass the req.body to the entry
  console.log("ReqBody " + req.body)
  db.Comment.create(req.body)
    .then(function(dbComment) {
      // If a Comment was created successfully, find one Story with an `_id` equal to `req.params.id`. Update the Story to be associated with the new Comment
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Story.findOneAndUpdate({ _id: req.params.id }, { comment: dbComment._id }, { new: true });
    })
    .then(function(dbStory) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbStory);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});



// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});
