let io;

module.exports = {
  init: (httpsServer) => {
    io = require("socket.io")(httpsServer);
    return io;
  },
  getIo: () => {
    if (!io) {
      throw new Error("socket.io not initialized");
    }
    return io;
  },
};
