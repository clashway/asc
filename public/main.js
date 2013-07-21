var socket = io.connect();

socket.on('connect', function() {
    $('#status').text('Connected');
});
socket.on('disconnect', function() {
    $('#status').text('Disconnected');
});
socket.on('story list', function(data) {
    $('#story-list').html(data.stories);
});

$(document).ready(function() {
    var frm = $('#story-form');
    $('#story-form').submit(function(event) {
        event.preventDefault();
        socket.emit('new story', { story : $('#story-form').serialize() });
    });

    $("#story-list a").live('click', function(event) {
        event.preventDefault();
        socket.emit('vote', { story_title : $(this).attr('rel') });
    });
});
