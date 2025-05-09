const express = require("express");
const session = require("express-session");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = 3000;
const users = [];

const sessionMiddleware = session({
  secret: "chat_secret",
  resave: false,
  saveUninitialized: false
});

app.use(sessionMiddleware);
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// Bind session to Socket.IO
io.engine.use(sessionMiddleware);

// --- Auth Routes (example only, assume you've implemented) ---
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.send("Invalid credentials");
  req.session.username = username;
  res.redirect("/chat.html");
});

app.post("/signup", (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) return res.send("Username exists");
  users.push({ username, password });
  res.redirect("/index.html");
});

app.get("/chat.html", (req, res) => {
  if (!req.session.username) return res.redirect("/index.html");
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/index.html"));
});

// --- Socket.IO logic with session-aware usernames ---
const userSockets = new Map(); // username => socket

io.on("connection", (socket) => {
  const session = socket.request.session;
  const username = session.username || "Anonymous";
  const role = session.role || "user";

  userSockets.set(username, socket);

  console.log(`${username} connected (${role})`);

  // Track typing
  socket.on("typing", () => {
    if (role === "admin") {
      socket.broadcast.emit("typing", username);
    } else {
      socket.broadcast.to(socket.id).emit("typing", username); // Only themselves
    }
  });

  socket.on("stop typing", () => {
    if (role === "admin") {
      socket.broadcast.emit("stop typing");
    } else {
      socket.broadcast.to(socket.id).emit("stop typing");
    }
  });

  // Handle chat message
  socket.on("chat message", (text) => {
    const msg = { user: username, text };

    if (role === "admin") {
      io.emit("chat message", msg); // Send to all
    } else {
      socket.emit("chat message", msg); // Send only to self
    }
  });

  // Update online users for admin only
  const updateUserList = () => {
    const userList = Array.from(userSockets.keys());
    for (let [user, sock] of userSockets.entries()) {
      if (sock.request.session.role === "admin") {
        sock.emit("update users", userList);
      } else {
        sock.emit("update users", [user]); // Only themselves
      }
    }
  };

  updateUserList();

  socket.on("disconnect", () => {
    console.log(`${username} disconnected`);
    userSockets.delete(username);
    updateUserList();
  });
});

function ensureAuthenticated(req, res, next) {
  if (req.session.username) return next();
  res.redirect("/index.html");
}

function ensureAdmin(req, res, next) {
  if (req.session.role === 'admin') return next();
  res.redirect("/chat.html");
}
app.get("/admin.html", ensureAuthenticated, ensureAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/chat.html", ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});

server.listen(port, () => {
  console.log(`Chat app listening on http://localhost:${port}`);
});
