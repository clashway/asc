var http     = require('http'),
    io       = require('socket.io'),
    qs       = require('querystring'),
    template = require('swig'),
    story    = require('./includes/story.js'),
    express  = require('express');

var port = 8111;
var story_list_loc = __dirname + '/public/views/story_list.html';

// Initialize the db
var dburl = 'localhost/asc';
var collections = ['stories'];
var db = require('mongojs').connect(dburl, collections);
db.stories.ensureIndex( { "title" : 1 }, {unique : true} );

// Initialize express
var app = express();
app.use(express.static(__dirname + '/public'));
app.use(express.errorHandler({showStack: false, dumpExceptions: false}));

// Initialize http for socket
var socket = io.listen(http.createServer(app).listen(port));
console.log('Connected at: 127.0.0.1:' + port);

socket.sockets.on('connection', function(client) {
    // On connection show the user all the current stories
    getStoriesRendered({type: 'backlog'}, function(stories) {
        client.emit('backlog list', { stories: stories });
    });

    getStoriesRendered({sort: {title : 1}}, function(stories) {
        client.emit('selected list', { stories: stories });
    });

    client.on('new story', function(data) {
        // Submit the new story to the db
        var parsed = qs.parse(data.story);
        var new_story = new story(parsed.title, parsed.user_story, parsed.tshirt);
        db.stories.save(new_story, function (err, success) {
            getStoriesRendered({type: 'backlog'}, function(stories) {
                client.emit('backlog list', { stories: stories });
                client.broadcast.emit('backlog list', { stories: stories });
            });
        });
     });

    client.on('vote', function(data) {
        var query = {title: data.story_title};
        db.stories.find(query, function(err, stories) {
            stories.forEach( function(voted_story) {
                voted_story.vote++;
                db.stories.save(voted_story, function (err, success) {
                    getStoriesRendered({type: 'backlog'}, function(stories) {
                        client.emit('backlog list', { stories: stories });
                        client.broadcast.emit('backlog list', { stories: stories });
                    });
                });
            });
        });
    });

    client.on('selected', function(data) {
        var query = {title: data.story_title};
        db.stories.find(query, function(err, stories) {
            stories.forEach( function(selected_story) {
                selected_story.chosen.selected = 1;
                db.stories.save(selected_story, function (err, success) {
                    getStoriesRendered({sort: {title : 1}}, function(stories) {
                        client.emit('selected list', { stories: stories });
                        client.broadcast.emit('selected list', { stories: stories });
                    });
                    getStoriesRendered({type: 'backlog'}, function(stories) {
                        client.emit('backlog list', { stories: stories });
                        client.broadcast.emit('backlog list', { stories: stories });
                    });
                });
            });
        });
    });
});

function getStoriesRendered(options, successCallback) {
    // Exclude chosen stories
    var query = (options.type == 'backlog') ? {"chosen.selected" : 0} : {"chosen.selected" : 1};
    var sort = options.sort || {vote : -1};
    console.log(sort);
    db.stories.find(query).sort(sort, function(err, stories) {
        if (err || !stories) {
            console.log("No stories found");
        } else {
            var tmpl = template.compileFile(story_list_loc);
            renderedHtml = tmpl.render({
                stories : stories
            });
            successCallback(renderedHtml);
        }
    });
};1