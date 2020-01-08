var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var path = require("path");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

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

// Set Handlebars.
var exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({
  defaultLayout: "main",
  partialsDir: path.join(__dirname, "/views/layouts/partials")
}));
app.set("view engine", "handlebars");


// If deployed, use the deployed DB, else use the local srappyNews DB.
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/scrappyNews";
// Connect to the Mongo DB
mongoose.connect(MONGODB_URI);

// ROUTES

/******************************************** */
// GET route for getting all stories from the db
/**********************************************/

app.get("/", function (req, res) {
  // Grab every document in the Stories collection
  db.Story.find({ "saved": false })
    .then(function (dbStory) {
      // If we were able to successfully find Stories, send them back to the client
      var hbsObject = { stories: dbStory }
      res.render("index", hbsObject);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

/****************************************************/
// A GET route for scraping the Navajo Times website
/****************************************************/

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

      // Create a new Story using the `result` object built from scraping
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

//Post route for saving stories

app.post("/saved/:id", function (req, res) {
  db.Story.findOneAndUpdate({ "_id": req.params.id }, { "$set": { "saved": true } })
    .then(function (result) {
      res.json(result);
    }).catch(function (err) {
      console.log(err);
    });
});

// route for displaying saved stories
app.get("/saved/", function (req, res) {
  db.Story.find({ "saved": true })
    .populate("comments")
    .then(function (result) {
      var hbsObject = { stories: result }
      res.render("saved", hbsObject);
    })
    .catch(function (err) {
      res.json(err);
    });
});

// route for deleting articles from saved articles and display back on home page
app.post("/delete/:id", function (req, res) {
  console.log("REQ PARAMS ID: " + req.params.id);
  db.Story.findOneAndUpdate({ "_id": req.params.id }, { "$set": { "saved": false } })
    .then(function (result) {
      res.json(result);
    }).catch(function (err) {
      res.json(err);
    });
});


/***********************************************************/
// A POST route creating a comment then putting its id 
// in the comment field of Story
/***********************************************************/

app.post("/articles/:id", function (req, res) {
  // Create a new comment and pass the req.body to the entry
  console.log("ReqBody " + req.body)
  db.Comment.create(req.body)
    .then(function (dbComment) {
      // If a Comment was created successfully, find one Story with an `_id` equal to `req.params.id`. Update the Story to be associated with the new Comment
      // { new: true } tells the query that we want it to return the updated Story -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Story.findOneAndUpdate({ _id: req.params.id }, { comments: dbComment._id }, { new: true });
    })
    .then(function (dbStory) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbStory);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});




/******************************/
// Route for grabbing a specific Article by id, populate it with it's comment
/******************************/

app.get("/populate/:id", function (req, res) {
  console.log("ReqParamsId: " + req.params.id);
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Story.findOne({ _id: req.params.id })
    // ..and populate all of the comments associated with it
    .populate("comments")  // populating the field comments.
    .then(function (dbStory) {
      // If we were able to successfully find a Story with the given id, send it back to the client
      //console.log("After Population: " + dbStory);
      var hbsObject = { stories: dbStory };
      //res.render("comments", hbsObject);
      res.json(hbsObject);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// route for deleting a comment
app.post("/deleteComment/:id", function(req,res){
  db.Comment.remove({"_id": req.params.id})
  .then(function(result){
    res.json(result);
  }).catch(function(err){
    res.json(err);
  });
});


// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});


