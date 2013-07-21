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
    frm.on( "submit", function(event) {
        event.preventDefault();
        socket.emit('new story', { story : frm.serialize() });
    });
});