$(document).ready(function() {
    var socket = io.connect('http://localhost:8000');
    var cur_user = $('form#chat span').text();
    var cur_room = 'main';

    socket.emit("logged_in", {user: cur_user});

    socket.on("room_data", (data) => {
        $('#chatbox').html("");
        $('#chatbox').append("<p>You joined " + cur_room + "!</p>");
        if ('room' in data) {
            $('#room_user_list').text("Users in " + data.room);
        }
        $('#users').html("");
        for (let user of data.users) {
            $('#users').append("<li>" + user.name + "</li>");
        }
        if ('rooms' in data) {
            for (let key in data.rooms) {
                $('#rooms').append("<li><a href='#' class='room' data-room='" + key + "'>" + data.rooms[key].name + "</a></li>");
            }
        }
    });

    socket.on("new_user", (data) => {
        $('#chatbox').append("<p>" + data.user.name + " joined the room!</li>");
        $('#users').append("<li>" + data.user.name + "</li>");
    });

    socket.on("new_message", (data) => {
        let message_string = "<p><span class='name'>" + data.user.name + "</span>: " + data.message + "</p>";
        $('#chatbox').append(message_string);
    });

    socket.on("new_room", (data) => {
        $('#rooms').append("<li><a href='#' class='room' data-room='" + data.key + "'>" + data.name + "</a></li>");
    });

    socket.on("user_left", (data) => {
        $('#chatbox').append("<p>" + data.user + " left!</li>");
        var user_string = "";
        for (let user of data.users) {
            user_string += "<li>" + user.name + "</li>";
        }
        $('#users').html(user_string);
    });

    $('form#chat').submit(function(e) {
        e.preventDefault();
        let message_text = $('#message').val();
        let message_string = "<p><span class='myname'>" + cur_user + "</span>: " + message_text + "</p>";
        $('#chatbox').append(message_string);
        socket.emit("sent_message", {message: message_text, room: cur_room});
        $('#message').val("");
    });

    $('form#new_room').submit(function(e) {
        e.preventDefault();
        let room_name = $('#room').val();
        socket.emit("created_room", {room: room_name});
        $('#room').val("");
    });

    $('#rooms').on('click', 'a.room', function(e) {
        e.preventDefault();
        cur_room = $(this).data('room');
        socket.emit("joined_room", {room: cur_room});
    });

});