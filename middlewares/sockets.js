'use strict'

const io = require('socket.io')(3001);

io.on('connection', function (socket) {

  console.log('connection');
  socket.emit('news', { hello: 'world' });

  /*   socket.on('my other event', function (data) {
      console.log(data);
    });
   */
});/* */

exports.updatePoint = (req, res, next) => {

  io.emit('news', { message: req.body });
  console.log('update');
  next();
}

exports.deleteGeofence = (req, res, next) => {

  io.emit('news', { message: 'deleted' });
  console.log('delete');
  next();
}