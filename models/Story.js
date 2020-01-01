var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, create a new StorySchema object
// This is similar to a Sequelize model
var StorySchema = new Schema({
  // `title` is required and of type String
  title: {
    type: String,
    required: true,
    unique: true
  },
  // `link` is required and of type String
  link: {
    type: String,
    required: true
  },
  // summary is required and is of type String
  summary: {
      type: String,
      required: true
  },
  date_updated: {
    type: String
  },
  saved: {
    type: Boolean,
    required: true,
    default: false
  },
  // `comment` is an object that stores a Comment id
  // The ref property links the ObjectId to the Comment model
  // This allows us to populate the Story with an associated Comment
  comment: {
    type: Schema.Types.ObjectId,
    ref: "Comment"
  }
});

// This creates our model from the above schema, using mongoose's model method
var Story = mongoose.model("Story", StorySchema);

// Export the Article model
module.exports = Story;
