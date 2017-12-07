var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var path = require("path");
var session = require("express-session");
var mongoose = require("mongoose");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, "./client/static")));
app.use(session({
    secret: "fjias891z0zn0fj01",
    resave: true,
    saveUninitialized: true
}));

app.set("views", path.join(__dirname, "./client/views"));
app.set("view engine", "ejs");

require('./server/config/mongoose.js');

var routes = require('./server/config/routes.js');
routes(app);


var server = require('http').createServer(app);
var io = require('socket.io')(server);

var users = {};
var rooms = {
    main: {
        name: 'Main',
        room_users: []
    }
};

io.sockets.on('connection', function (socket) {

    socket.on("logged_in", (data) => {
        users[socket.id] = {
            name: data.user,
            room: 'main'
        };
        rooms.main.room_users.push(users[socket.id]);
        socket.room = 'main';
        socket.join('main');
        socket.emit("room_data", {users: rooms.main.room_users, rooms: rooms});
        socket.broadcast.to('main').emit("new_user", {user: users[socket.id]});
    });

    socket.on("sent_message", (data) => {
        socket.broadcast.to(data.room).emit("new_message", {user: users[socket.id], message: data.message})
    });

    socket.on("joined_room", (data) => {
        if (socket.room) {
            for (let i = 0, len = rooms[socket.room].room_users.length; i !== len; i++) {
                if (rooms[socket.room].room_users[i] === users[socket.id]) {
                    rooms[socket.room].room_users.splice(i, 1);
                    break;
                }
            }
            socket.broadcast.to(socket.room).emit("user_left", {user: users[socket.id].name, users: rooms[socket.room].room_users});
            socket.leave(socket.room);
        }
        socket.room = data.room;
        socket.join(data.room);
        users[socket.id].room = data.room;
        rooms[data.room].room_users.push(users[socket.id]);
        socket.emit("room_data", {users: rooms[data.room].room_users, room: rooms[data.room].name});
        socket.broadcast.to(data.room).emit("new_user", {user: users[socket.id]});
    });

    socket.on("created_room", (data) => {
        const key = data.room.toLowerCase().split(' ').join('');
        rooms[key] = {
            name: data.room,
            room_users: []
        };
        io.sockets.emit("new_room", {key: key, name: data.room});
    });

    socket.on("disconnect", () => {
        console.log('disco, socket is: ', socket.id);
        const room_id = users[socket.id].room;
        for (let i = 0, len = rooms[room_id].room_users.length; i !== len; i++) {
            if (rooms[room_id].room_users[i] === users[socket.id]) {
                rooms[room_id].room_users.splice(i, 1);
                break;
            }
        }
        socket.broadcast.to(room_id).emit("user_left", {user: users[socket.id].name, users: rooms[room_id].room_users});
        delete users[socket.id];
    });

});

server.listen(8000, function(){
    console.log("listening on port 8000");
});