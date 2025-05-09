const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const path = require("path");
const app = express();
const port = 3000;

const users = [];

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: "secretkey",
  resave: false,
  saveUninitialized: false
}));

// Home redirects to login
app.get("/", (req, res) => {
  res.redirect("/index.html");
});

// Signup logic
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = users.find(u => u.username === username);
  if (existingUser) return res.send("Username already exists");

  users.push({ username, password: hashedPassword });
  res.redirect("/index.html");
});

// Login logic
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.send("Invalid credentials");
  }

  req.session.user = user.username;
  res.redirect("/chat.html");
});

// Protect chat page
app.get("/chat.html", (req, res, next) => {
  if (!req.session.user) return res.redirect("/index.html");
  next();
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/index.html");
  });
});

app.listen(port, () => {
  console.log(`Chat app listening at http://localhost:${port}`);
});
