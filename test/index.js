/**
 * import(s)
 */

var expect = require('expect.js');
var format = require('util').format;
var zmqServer = require('../');


/**
 * test(s)
 */

describe('socket.io-zeromq-server', function () {
  it('should be ok', function (done) {
    expect(zmqServer()).to.be.ok;
    done();
  });
});
