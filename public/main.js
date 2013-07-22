var socket = io.connect();

socket.on('connect', function() {
    $('#status').text('Connected');
});
socket.on('disconnect', function() {
    $('#status').text('Disconnected');
});
socket.on('backlog list', function(data) {
    $('#backlog-list').html(data.stories);
});
socket.on('selected list', function(data) {
    $('#selected-list').html(data.stories);
});

$(document).ready(function() {
    var frm = $('#story-form');
    $('#story-form').submit(function(event) {
        event.preventDefault();
        socket.emit('new story', { story : $('#story-form').serialize() });
    });

    $("#select-button").live('click', function(event) {
        socket.emit('selected', { story_title : $(this).attr('rel') });
    });

    $("#vote-button").live('click', function(event) {
        socket.emit('vote', { story_title : $(this).attr('rel') });
    });

    $(".story-title").live('click', function(event) {
        $(this).siblings("p").toggle("slow");
    });
});
