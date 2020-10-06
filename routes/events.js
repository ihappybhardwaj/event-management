var express = require("express");
var router  = express.Router();
var Eventh = require("../models/events");
var Comment = require("../models/comment");
var middleware = require("../middleware");
var geocoder = require('geocoder');
var { isLoggedIn, checkUserEvent, checkUserComment, isAdmin, isSafe } = middleware; // destructuring assignment

// Define escapeRegex function for search feature
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

//INDEX - show all Eventh
router.get("/", function(req, res){
  console.log(req.xhr)
  if(req.query.search && req.xhr) {
      const regex = new RegExp(escapeRegex(req.query.search), 'gi');
      // Get all Eventh from DB
      Eventh.find({name: regex}, function(err, allEvents){
         if(err){
            console.log(err);
         } else {
            res.status(200).json(allEvents);
         }
      });
  } else {
      // Get all Eventh from DB
      Eventh.find({}, function(err, allEvents){
         if(err){
             console.log(err);
         } else {
            if(req.xhr) {
              res.json(allEvents);
            } else {
              res.render("events/index",{events: allEvents, page: 'events'});
            }
         }
      });
  }
});

//CREATE - add new Eventh to DB
router.post("/", isLoggedIn, isSafe, function(req, res){
  // get data from form and add to Eventh array
  var name = req.body.name;
  var image = req.body.image;
  var desc = req.body.description;
  var author = {
      id: req.user._id,
      username: req.user.username
  }
  var cost = req.body.cost;
    var newEvent = {name: name, image: image, description: desc, cost: cost, author:author};
    // Create a new Eventh and save to DB
    Eventh.create(newEvent, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to Eventh page
            console.log(newlyCreated);
            res.redirect("/events");
        }
    });
  });


//NEW - show form to create new Eventh
router.get("/new", isLoggedIn, function(req, res){
   res.render("events/new");
});

// SHOW - shows more info about one Eventh
router.get("/:id", function(req, res){
    //find the Eventh with provided ID
    Eventh.findById(req.params.id).populate("comments").exec(function(err, foundEvent){
        if(err || !foundEvent){
            console.log(err);
            req.flash('error', 'Sorry, that Eventh does not exist!');
            return res.redirect('/events');
        }
        console.log(foundEvent)
        //render show template with that Eventh
        res.render("events/show", {eventh: foundEvent});
    });
});

// EDIT - shows edit form for a Eventh
router.get("/:id/edit", isLoggedIn, checkUserEvent, function(req, res){
  //render edit template with that Eventh
  res.render("events/edit", {eventh: req.eventh});
});

// PUT - updates Eventh in the database
router.put("/:id", isSafe, function(req, res){
    var newData = {name: req.body.name, image: req.body.image, description: req.body.description, cost: req.body.cost};
    Eventh.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, eventh){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/events/" + eventh._id);
        }
    });
  });


// DELETE - removes Eventh and its comments from the database
router.delete("/:id", isLoggedIn, checkUserEvent, function(req, res) {
    Comment.remove({
      _id: {
        $in: req.eventh.comments
      }
    }, function(err) {
      if(err) {
          req.flash('error', err.message);
          res.redirect('/');
      } else {
          req.Eventh.remove(function(err) {
            if(err) {
                req.flash('error', err.message);
                return res.redirect('/');
            }
            req.flash('error', 'Events deleted!');
            res.redirect('/events');
          });
      }
    })
});

module.exports = router;

