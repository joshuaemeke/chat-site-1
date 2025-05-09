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
io.on("connection", (socket) => {
  const req = socket.request;
  const username = req.session.username || "Anonymous";

  console.log(`${username} connected`);

  socket.on("chat message", (msg) => {
    io.emit("chat message", { user: username, text: msg });
  });

  socket.on("disconnect", () => {
    console.log(`${username} disconnected`);
  });
});

server.listen(port, () => {
  console.log(`Chat app listening on http://localhost:${port}`);
});
