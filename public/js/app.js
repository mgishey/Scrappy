//Click function for scraping

$("#scrapeButton").on("click", function () {
  $.ajax({
    method: "GET",
    url: "/scrape"
  }).then(function (data) {
    //console.log(data);
    window.location = "/";
  });
});

//Click function for save button to save a story
$(".save").on("click", function(){
  var thisId = $(this).attr("data-id");
  console.log("Saved ID: " + thisId);
  $.ajax({
    method: "POST",
    url: "/saved/" + thisId
  }).then(function(data){
    window.location = "/saved";
  });
});

//Click function for deleting a story from the saved page (from the saved-stories partial)
$(".delete").on("click", function() {
  var thisId = $(this).attr("data-id");
  //console.log("Deleted ID: " + thisId);
  $.ajax({
      method: "POST",
      url: "/delete/" + thisId
  }).then(function(data) {
      window.location = "/"
  });
});

//Click function to save a Comment (from the modal)

$(".saveComment").on("click", function (){
  var thisId = $(this).attr("data-id");
  //console.log("comment id: " + thisId);
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      body: $("#commentText" + thisId).val()
    }
  }).then(function(data) {
    console.log(data);
    // Empty the comment section
    //console.log("THIS ID: " + thisId);
    $("#commentText" + thisId).val("");
    $(".modalComment").modal("hide");
    window.location = "/saved";
  });
});



// Click function to view/add a comment

$(".addComment").on("click", function () {
  var thisId = $(this).attr("data-id");
  // Now make an ajax call for the story
  $.ajax({
    method: "GET",
    url: "/populate/" + thisId
  })
    // With that done, add the comment information to the page
    .then(function (data) {
      console.log(data);
      window.location("/saved");
    });
});

//Click function for deleting one note
$(".deleteComment").on("click", function(){
  var thisId = $(this).attr("data-comment-id");
  console.log("DELETE ID: " + thisId);
  $.ajax({
    method: "POST",
    url: "/deleteComment/" + thisId
  }).then (function(data){
    console.log(data);
    window.location = "/saved";
  });
});
