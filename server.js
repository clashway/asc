var http    = require('http'),
    io      = require('socket.io'),
    qs      = require('querystring'),
    express = require('express');

var port = 8111;

// Initialize the db
var dburl = 'localhost/mongoapp';
var collections = ['backlog'];
var db = require('mongojs').connect(dburl, collections);

// Initialize express
var app = express();
app.use(express.static(__dirname + '/public'));
app.use(express.errorHandler({showStack: false, dumpExceptions: false}));

// Initialize http for socket
var socket = io.listen(http.createServer(app).listen(port));
console.log('Connected at: 127.0.0.1:' + port);

// Define the Story object
function story(description, tshirt) {
    this.description = description;
    this.tshirt = tshirt;
}

socket.sockets.on('connection', function(client) {
    // On connection show the user all the current stories
    db.backlog.find('', function(err, stories) {
        var storyTitles = '';
        stories.forEach( function(story) {
            storyTitles += '<li>' + story.description + '</li>';
        });
        client.emit('story list', { stories: storyTitles });
    });

    client.on('new story', function(data) {
        // Submit the new story to the db
        var parsed = qs.parse(data.story);
        var new_story = new story(parsed.description, parsed.tshirt);
        db.backlog.save(new_story, function (err, success) {
            // Grab the current stories now after the insert
            db.backlog.find('', function(err, stories) {
                var storyTitles = '';
                stories.forEach( function(story) {
                    storyTitles += '<li>' + story.description + '</li>';
                });
                client.emit('story list', { stories: storyTitles });
                client.broadcast.emit('story list', { stories: storyTitles });
            });
        });
     });

});

