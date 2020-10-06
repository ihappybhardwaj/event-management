const express = require("express");
const router  = express.Router({mergeParams: true});
const events = require("../models/events");
const Comment = require("../models/comment");
const middleware = require("../middleware");
const { isLoggedIn, checkUserComment, isAdmin } = middleware;

//Comments New
router.get("/new", isLoggedIn, function(req, res){
    // find events by id
    console.log(req.params.id);
    events.findById(req.params.id, function(err, events){
        if(err){
            console.log(err);
        } else {
             res.render("comments/new", {events: events});
        }
    })
});

//Comments Create
router.post("/", isLoggedIn, function(req, res){
   //lookup events using ID
   events.findById(req.params.id, function(err, events){
       if(err){
           console.log(err);
           res.redirect("/eventss");
       } else {
        Comment.create(req.body.comment, function(err, comment){
           if(err){
               console.log(err);
           } else {
               //add username and id to comment
               comment.author.id = req.user._id;
               comment.author.username = req.user.username;
               //save comment
               comment.save();
               events.comments.push(comment);
               events.save();
               console.log(comment);
               req.flash('success', 'Created a comment!');
               res.redirect('/eventss/' + events._id);
           }
        });
       }
   });
});

router.get("/:commentId/edit", isLoggedIn, checkUserComment, function(req, res){
  res.render("comments/edit", {events_id: req.params.id, comment: req.comment});
});

router.put("/:commentId", isAdmin, function(req, res){
   Comment.findByIdAndUpdate(req.params.commentId, req.body.comment, function(err, comment){
       if(err){
          console.log(err);
           res.render("edit");
       } else {
           res.redirect("/eventss/" + req.params.id);
       }
   }); 
});

router.delete("/:commentId", isLoggedIn, checkUserComment, function(req, res){
  // find events, remove comment from comments array, delete comment in db
  events.findByIdAndUpdate(req.params.id, {
    $pull: {
      comments: req.comment.id
    }
  }, function(err) {
    if(err){ 
        console.log(err)
        req.flash('error', err.message);
        res.redirect('/');
    } else {
        req.comment.remove(function(err) {
          if(err) {
            req.flash('error', err.message);
            return res.redirect('/');
          }
          req.flash('error', 'Comment deleted!');
          res.redirect("/eventss/" + req.params.id);
        });
    }
  });
});

module.exports = router;