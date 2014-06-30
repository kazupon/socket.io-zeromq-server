/**
 * import(s)
 */

var expect = require('expect.js');
var format = require('util').format;
var spawn = require('child_process').spawn;
var msgpack = require('msgpack-js');
var zmq = require('zmq');
var hasBin = require('has-binary-data');
var parser = require('socket.io-parser');


/**
 * test(s)
 */

describe('socket.io-zeromq-server', function () {
  var emitter, client, server;

  function emit () {
    var args = Array.prototype.slice.call(arguments);
    var packet = {
      type: hasBin(args) ? parser.BINARY_EVENT : parser.EVENT,
      data: args,
      nsp: '/'
    };
    var key = new Buffer('socket.io-zmq#emitter ', 'binary');
    var payload = msgpack.encode([packet, { rooms: {}, flags: {} }]);
    emitter.send(Buffer.concat([key, payload]));
  }

  function getOffset (msg) {
    var offset = 0;
    for (var i = 0; i < msg.length; i++) {
      if (msg[i] === 0x20) { // space
        offset = i;
        break;
      }
    }
    return offset;
  }


  before(function (done) {
    server = spawn('bin/socket.io-zeromq-server', [
      '--subaddress', '127.0.0.1',
      '--subport', '5555',
      '--pubaddress', '127.0.0.1',
      '--pubport', '5556'
    ]);
    done();
  });

  after(function (done) {
    server.kill();
    done();
  });


  it('should be run', function (done) {
    var emitter_address = 'tcp://127.0.0.1:5555';
    var client_address = 'tcp://127.0.0.1:5556';
    emitter = zmq.socket('pub');
    emitter.connect(emitter_address);
    client = zmq.socket('sub');
    client.connect(client_address);
    client.subscribe('');

    var args = ['person', { name: 'foo', age: 18 }];
    
    client.on('message', function (msg) {
      var offset = getOffset(msg);
      var key = msg.slice(0, offset);
      var payload = msgpack.decode(msg.slice(offset + 1, msg.length));
      var data = payload[0];
      expect(key).to.match(/^socket\.io\-zmq#.*$/);
      expect(payload).to.be.an(Array);
      expect(data.data[0]).to.eql(args[0]);
      expect(data.data[1]).to.eql(args[1]);
      expect(data.nsp).to.eql('/');

      client.disconnect(client_address);
      emitter.disconnect(emitter_address);
      done();
    });

    // emit !!
    setInterval(function () {
      emit(args[0], args[1]);
    }, 10);
  });
});
