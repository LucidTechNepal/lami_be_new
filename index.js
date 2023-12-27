const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");

// Importing Database connection
require("./database/database");

// Importing routes
const route_client = require("./routers/clientroute");
const route_admin = require("./routers/adminroute");
const route_conversation = require("./routers/conversations");
const route_message = require("./routers/messages");
const route_profileView = require("./routers/clientProfileViewroute");
const route_subscription = require("./routers/subscription");

// Importing middlewares
const { verifyClient, socketAuthencation } = require("./middlewares/auth");
const { checkVideoCallAccess } = require("./middlewares/rbac.middleware");
const { errorConverter, errorHandler } = require("./middlewares/error");

// Importing chat services
const chatService = require("./chatService/chat-service");

const app = express();
const server = http.createServer(app);

process.on("uncaughtException", function (err) {
  console.log(err);
});

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const onlineUsers = new Map();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "uploads")));

// Routes
app.use(route_client);
app.use("/conversations", route_conversation);
app.use("/messages", route_message);
app.use("/subscription", route_subscription);
app.use(route_profileView);

// Socket.IO Middleware
io.use((socket, next) => {
  socketAuthencation(socket, next);
});

io.on("connection", async (socket) => {
  const userId = socket.userId;
  const role = socket.role;
  let count = 0;

  console.log(userId, `socket${(count = +count)}`);

  onlineUsers.set(userId, socket.id);

  // Emit the online users to all connected users
  io.emit("user-online", onlineUsers);

  socket.on("room:join", (data) => {
    const { userId, room } = data;
    socket.join(room);
    io.to(room).emit("user:joined", { userId, room });
  });

  socket.on("disconnect", () => {
    onlineUsers.delete(userId);

    // Emit the offline users to all connected users
    io.emit("user-offline", onlineUsers);
  });

  // Handle chat messages
  socket.on("chat", async (data) => {
    console.log(data, "socket");
    try {
      const { senderId, receiverId, message } = data;
      const savedMessage = await chatService.createMessage(
        senderId,
        receiverId,
        message
      );
      if (savedMessage) {
        const senderSocketId = onlineUsers.get(userId);
        let receiverSocketId;
        for (const [key, value] of onlineUsers) {
          if (value === senderSocketId) {
            continue;
          }
          receiverSocketId = value;
          break;
        }
        const reponseData = {
          senderId,
          receiverId,
          message,
        };

        io.to(receiverSocketId).emit("chat", reponseData);
      }
    } catch (err) {
      io.emit("error", err);
    }
  });

  socket.on("makeCall", (data) => {
    console.log(data, "data");
    let callerId = data.callerId;
    let calleeId = data.calleeId;
    let sdpOffer = data.sdpOffer;

    socket.join(calleeId);

    io.to(calleeId).emit("newCall", {
      callerId: callerId,
      sdpOffer: sdpOffer,
    });
  });

  // Use print() to log messages to the console

  socket.on("answerCall", (data) => {
    let callerId = data.callerId;
    let sdpAnswer = data.sdpAnswer;

    socket.to(callerId).emit("callAnswered", {
      callee: socket.user,
      sdpAnswer: sdpAnswer,
    });
  });

  socket.on("IceCandidate", (data) => {
    let calleeId = data.calleeId;
    let iceCandidate = data.iceCandidate;

    socket.to(calleeId).emit("IceCandidate", {
      sender: socket.user,
      iceCandidate: iceCandidate,
    });
  });
});

const port = process.env.PORT || 4000;

//send back 404 error if request not found
// app.use((req, res, next) => {
//   next(new ApiError(httpStatus.NOT_FOUND, "Not Found"));
// });

//convert error to  ApiError
// app.use(errorConverter);

// //handling error
// app.use(errorHandler);

// connecting to server

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
