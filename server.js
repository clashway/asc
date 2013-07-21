var http    = require('http'),
    io      = require('socket.io'),
    qs      = require('querystring'),
    express = require('express');

var port = 8111;

// Initialize the db
var dburl = 'localhost/asc';
var collections = ['stories'];
var db = require('mongojs').connect(dburl, collections);

// Initialize express
var app = express();
app.use(express.static(__dirname + '/public'));
app.use(express.errorHandler({showStack: false, dumpExceptions: false}));

// Initialize http for socket
var socket = io.listen(http.createServer(app).listen(port));
console.log('Connected at: 127.0.0.1:' + port);

// Define the Story object
function story(description, tshirt, vote) {
    this.description = description;
    this.tshirt = tshirt;
    this.vote = vote;
}
db.stories.ensureIndex( { "description" : 1 }, {unique : true} );

socket.sockets.on('connection', function(client) {
    // On connection show the user all the current stories
    getAllStories(function(stories) {
        client.emit('story list', { stories: stories });
    });

    client.on('new story', function(data) {
        // Submit the new story to the db
        var parsed = qs.parse(data.story);
        var new_story = new story(parsed.description, parsed.tshirt, 0);
        db.stories.save(new_story, function (err, success) {
            getAllStories(function(stories) {
                client.emit('story list', { stories: stories });
                client.broadcast.emit('story list', { stories: stories });
            });
        });
     });

    client.on('vote', function(data) {
        var query = {description: data.story_title};
        db.stories.find(query, function(err, stories) {
            stories.forEach( function(voted_story) {
                voted_story.vote++;
                db.stories.save(voted_story, function (err, success) {
                    // Grab the current stories now after the insert
                    getAllStories(function(stories) {
                        client.emit('story list', { stories: stories });
                        client.broadcast.emit('story list', { stories: stories });
                    });
                });
            });
        });
    });
});

function getAllStories(successCallback) {
    db.stories.find().sort({vote : -1}, function(err, stories) {
        if (err || !stories) {
            console.log("No stories found");
        } else {
            var storyTitles = '';
            stories.forEach( function(story) {
                storyTitles += '<li>';
                storyTitles += story.description + ' &nbsp <a rel="' + story.description + '" href="#">Vote</a>';
                storyTitles += '</li>';
            });
            successCallback(storyTitles);
        }
    });
};