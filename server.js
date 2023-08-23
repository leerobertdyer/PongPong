const express = require('express');
const app = express();
const server = app.listen(3000);
app.use(express.static('docs'));
const socket = require('socket.io');
const io = socket(server);

let players = []
let p1X = null;
let p2X = null;

io.sockets.on('connection', 
    function(socket) {
        console.log('new Connection: ' + socket.id);

        if (players.length < 2) {
            players.push({
                id: socket.id,
                socket: socket,
                number: playerNumber
            });
            var playerNumber = players.length;
    
        socket.emit('playerNumber', playerNumber);

        socket.on('paddlePosition', x => {
            socket.broadcast.emit('otherPlayerPosition', x)
    });

        socket.on('ballPosition', ball => {
            console.log("ball pos: " + ball)
            socket.broadcast.emit('ballPositionFromServer', ball)
        })

        socket.on('disconnect', () => {
            const playerIndex = players.findIndex((player) => player.id === socket.id);
            if (playerIndex !== -1) {
                players.splice(playerIndex, 1);
                console.log(`Player ${playerNumber} disconnected.`);
            }
        });

    }

    else {
        console.log("Too Many Players!");
        socket.emit('tooManyPlayers');
        socket.disconnect(true);
    }

});





// function newConnection(socket) {
//     console.log('new connection: ' + socket.id);
//     if (assign === 1){

//     }
//     else if (assign === 2){

//     }
//     else {
//         console.log("Too Many Players")
//     }
    //this is where i'll add recieved message code:

//     socket.on('ball', ballMove)

//     function ballMove(data) {
//         console.log(data)
//     }
// }
