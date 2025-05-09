const express = require("express")
const path = require("path")
const fs = require("fs")
const crypto = require("crypto")
const multer = require("multer")
const { v4: uuidv4 } = require("uuid")

const app = express()
const PORT = process.env.PORT || 7860

// Middleware
app.use(express.static(path.join(__dirname, "public")))
app.use(express.json())

// Users file path
const USERS_FILE = path.join(__dirname, "users.json")

// Add these variables for storing private chats and online status
const PRIVATE_CHATS_FILE = path.join(__dirname, "private_chats.json")
const ONLINE_USERS = new Map() // Track user online status

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(__dirname, "public", "uploads")
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  console.log("Created uploads directory")
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR)
  },
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname)
    const fileName = `${uuidv4()}${fileExt}`
    cb(null, fileName)
  },
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error("Only image files are allowed!"), false)
    }
    cb(null, true)
  },
})

// Initialize users file if it doesn't exist
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([]))
  console.log("Created users.json file")
}

// Initialize private chats file if it doesn't exist
if (!fs.existsSync(PRIVATE_CHATS_FILE)) {
  fs.writeFileSync(PRIVATE_CHATS_FILE, JSON.stringify({}))
  console.log("Created private_chats.json file")
}

// Simple password hashing
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex")
}

// Add this function after hashPassword
// Check and update online status
function updateOnlineStatus(userId, status) {
  if (status) {
    ONLINE_USERS.set(userId, Date.now())
  } else {
    ONLINE_USERS.delete(userId)
  }
}

// Generate a unique conversation ID for two users
function getConversationId(user1Id, user2Id) {
  // Sort IDs to ensure the same conversation ID regardless of order
  const sortedIds = [user1Id, user2Id].sort()
  return `${sortedIds[0]}_${sortedIds[1]}`
}

// Login endpoint
app.post("/api/login", (req, res) => {
  console.log("Login request received:", req.body)

  const { username, password } = req.body

  if (!username || !password) {
    console.log("Missing username or password")
    return res.json({
      success: false,
      message: "Username and password are required",
    })
  }

  try {
    // Read users from file
    let users = []
    try {
      const usersData = fs.readFileSync(USERS_FILE, "utf8")
      users = JSON.parse(usersData)
      console.log("Users loaded:", users.length)
    } catch (err) {
      console.log("Error reading users file or empty file")
      users = []
    }

    // Find user
    const user = users.find((u) => u.username === username || u.email === username)

    if (!user) {
      console.log("User not found")
      return res.json({
        success: false,
        message: "User not found",
      })
    }

    // Check password
    const hashedPassword = hashPassword(password)
    console.log("Password check:", {
      provided: hashedPassword.substring(0, 10) + "...",
      stored: user.password.substring(0, 10) + "...",
    })

    if (user.password !== hashedPassword) {
      console.log("Incorrect password")
      return res.json({
        success: false,
        message: "Incorrect password",
      })
    }

    // Success
    console.log("Login successful for user:", user.username)
    const { password: _, ...userWithoutPassword } = user

    res.json({
      success: true,
      message: "Login successful",
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error("Login error:", error)
    res.json({
      success: false,
      message: "Server error",
    })
  }
})

// Register endpoint
app.post("/api/register", (req, res) => {
  console.log("Register request received:", req.body)

  const { username, email, password } = req.body

  if (!username || !email || !password) {
    console.log("Missing required fields")
    return res.json({
      success: false,
      message: "All fields are required",
    })
  }

  try {
    // Read users from file
    let users = []
    try {
      const usersData = fs.readFileSync(USERS_FILE, "utf8")
      users = JSON.parse(usersData)
      console.log("Users loaded for registration check:", users.length)
    } catch (err) {
      console.log("Error reading users file or empty file, creating new array")
      users = []
    }

    // Check if username exists
    if (users.some((u) => u.username === username)) {
      console.log("Username already exists")
      return res.json({
        success: false,
        message: "Username already exists",
      })
    }

    // Check if email exists
    if (users.some((u) => u.email === email)) {
      console.log("Email already exists")
      return res.json({
        success: false,
        message: "Email already exists",
      })
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      password: hashPassword(password),
      profilePicture: null,
      createdAt: new Date().toISOString(),
    }

    // Add to users array
    users.push(newUser)
    console.log("New user created:", newUser.username)

    // Save to file
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
    console.log("Users file updated, total users:", users.length)

    // Return success
    const { password: _, ...userWithoutPassword } = newUser

    res.json({
      success: true,
      message: "Registration successful",
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.json({
      success: false,
      message: "Server error",
    })
  }
})

// List all users (for testing)
app.get("/api/users", (req, res) => {
  try {
    const usersData = fs.readFileSync(USERS_FILE, "utf8")
    const users = JSON.parse(usersData)

    // Remove passwords
    const usersWithoutPasswords = users.map((user) => {
      const { password, ...userWithoutPassword } = user
      return userWithoutPassword
    })

    console.log("Returning user list, count:", users.length)
    res.json(usersWithoutPasswords)
  } catch (error) {
    console.error("Error getting users:", error)
    res.json([])
  }
})

// Add these endpoints before the "Start server" comment

// Get all users with online status
app.get("/api/users/online", (req, res) => {
  try {
    const usersData = fs.readFileSync(USERS_FILE, "utf8")
    const users = JSON.parse(usersData)

    // Check for expired online statuses (inactive for more than 2 minutes)
    const now = Date.now()
    for (const [userId, lastSeen] of ONLINE_USERS.entries()) {
      if (now - lastSeen > 120000) {
        // 2 minutes
        ONLINE_USERS.delete(userId)
      }
    }

    // Add online status to users
    const usersWithStatus = users.map((user) => {
      const { password, ...userWithoutPassword } = user
      return {
        ...userWithoutPassword,
        isOnline: ONLINE_USERS.has(user.id),
      }
    })

    res.json(usersWithStatus)
  } catch (error) {
    console.error("Error getting users with online status:", error)
    res.json([])
  }
})

// Update online status
app.post("/api/users/status", (req, res) => {
  const { userId, status } = req.body

  if (!userId) {
    return res.json({ success: false, message: "User ID is required" })
  }

  updateOnlineStatus(userId, status)
  res.json({ success: true })
})

// Get private chat messages between two users
app.get("/api/chat/private", (req, res) => {
  const { userId, receiverId } = req.query

  if (!userId || !receiverId) {
    return res.json({ success: false, message: "Both user IDs are required" })
  }

  try {
    const conversationId = getConversationId(userId, receiverId)

    // Read private chats
    let privateChats = {}
    try {
      const chatsData = fs.readFileSync(PRIVATE_CHATS_FILE, "utf8")
      privateChats = JSON.parse(chatsData)
    } catch (err) {
      console.log("Error reading private chats file or empty file")
      privateChats = {}
    }

    // Get conversation messages or return empty array
    const messages = privateChats[conversationId] || []

    res.json(messages)
  } catch (error) {
    console.error("Error getting private chat messages:", error)
    res.json([])
  }
})

// Send a private chat message
app.post("/api/chat/private", (req, res) => {
  const { userId, username, receiverId, receiverName, message } = req.body

  if (!userId || !username || !receiverId || !receiverName || !message) {
    return res.json({
      success: false,
      message: "User ID, username, receiver ID, receiver name, and message are required",
    })
  }

  try {
    // Update user's online status
    updateOnlineStatus(userId, true)

    const conversationId = getConversationId(userId, receiverId)

    // Read private chats
    let privateChats = {}
    try {
      const chatsData = fs.readFileSync(PRIVATE_CHATS_FILE, "utf8")
      privateChats = JSON.parse(chatsData)
    } catch (err) {
      console.log("Error reading private chats file or empty file")
      privateChats = {}
    }

    // Get conversation messages or create new array
    const messages = privateChats[conversationId] || []

    // Add new message
    const newMessage = {
      id: Date.now().toString(),
      senderId: userId,
      senderName: username,
      receiverId,
      receiverName,
      message,
      timestamp: new Date().toISOString(),
    }

    messages.push(newMessage)

    // Keep only the last 100 messages
    if (messages.length > 100) {
      messages = messages.slice(messages.length - 100)
    }

    // Update conversation
    privateChats[conversationId] = messages

    // Save to file
    fs.writeFileSync(PRIVATE_CHATS_FILE, JSON.stringify(privateChats))

    res.json({ success: true, message: newMessage })
  } catch (error) {
    console.error("Error sending private chat message:", error)
    res.json({ success: false, message: "Server error" })
  }
})

// Upload profile picture
app.post("/api/users/profile-picture", upload.single("profilePicture"), (req, res) => {
  const { userId } = req.body

  if (!userId) {
    return res.json({ success: false, message: "User ID is required" })
  }

  if (!req.file) {
    return res.json({ success: false, message: "No file uploaded" })
  }

  try {
    // Read users from file
    let users = []
    try {
      const usersData = fs.readFileSync(USERS_FILE, "utf8")
      users = JSON.parse(usersData)
    } catch (err) {
      console.log("Error reading users file or empty file")
      return res.json({ success: false, message: "Error reading users file" })
    }

    // Find user
    const userIndex = users.findIndex((u) => u.id === userId)

    if (userIndex === -1) {
      return res.json({ success: false, message: "User not found" })
    }

    // Delete old profile picture if exists
    if (users[userIndex].profilePicture) {
      const oldPicturePath = path.join(UPLOADS_DIR, path.basename(users[userIndex].profilePicture))
      if (fs.existsSync(oldPicturePath)) {
        fs.unlinkSync(oldPicturePath)
      }
    }

    // Update user with new profile picture
    const profilePicturePath = `/uploads/${req.file.filename}`
    users[userIndex].profilePicture = profilePicturePath

    // Save to file
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))

    res.json({
      success: true,
      message: "Profile picture updated successfully",
      profilePicture: profilePicturePath,
    })
  } catch (error) {
    console.error("Error updating profile picture:", error)
    res.json({ success: false, message: "Server error" })
  }
})

// Update user profile
app.put("/api/users/profile", (req, res) => {
  const { userId, username, email } = req.body

  if (!userId || !username || !email) {
    return res.json({ success: false, message: "User ID, username, and email are required" })
  }

  try {
    // Read users from file
    let users = []
    try {
      const usersData = fs.readFileSync(USERS_FILE, "utf8")
      users = JSON.parse(usersData)
    } catch (err) {
      console.log("Error reading users file or empty file")
      return res.json({ success: false, message: "Error reading users file" })
    }

    // Find user
    const userIndex = users.findIndex((u) => u.id === userId)

    if (userIndex === -1) {
      return res.json({ success: false, message: "User not found" })
    }

    // Check if username exists (if changed)
    if (username !== users[userIndex].username) {
      const usernameExists = users.some((u, i) => i !== userIndex && u.username === username)
      if (usernameExists) {
        return res.json({ success: false, message: "Username already exists" })
      }
    }

    // Check if email exists (if changed)
    if (email !== users[userIndex].email) {
      const emailExists = users.some((u, i) => i !== userIndex && u.email === email)
      if (emailExists) {
        return res.json({ success: false, message: "Email already exists" })
      }
    }

    // Update user
    users[userIndex].username = username
    users[userIndex].email = email

    // Save to file
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))

    // Return updated user
    const { password, ...userWithoutPassword } = users[userIndex]

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error("Error updating profile:", error)
    res.json({ success: false, message: "Server error" })
  }
})

// Change password
app.put("/api/users/password", (req, res) => {
  const { userId, currentPassword, newPassword } = req.body

  if (!userId || !currentPassword || !newPassword) {
    return res.json({
      success: false,
      message: "User ID, current password, and new password are required",
    })
  }

  try {
    // Read users from file
    let users = []
    try {
      const usersData = fs.readFileSync(USERS_FILE, "utf8")
      users = JSON.parse(usersData)
    } catch (err) {
      console.log("Error reading users file or empty file")
      return res.json({ success: false, message: "Error reading users file" })
    }

    // Find user
    const userIndex = users.findIndex((u) => u.id === userId)

    if (userIndex === -1) {
      return res.json({ success: false, message: "User not found" })
    }

    // Check current password
    const hashedCurrentPassword = hashPassword(currentPassword)
    if (users[userIndex].password !== hashedCurrentPassword) {
      return res.json({ success: false, message: "Current password is incorrect" })
    }

    // Update password
    users[userIndex].password = hashPassword(newPassword)

    // Save to file
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))

    res.json({ success: true, message: "Password changed successfully" })
  } catch (error) {
    console.error("Error changing password:", error)
    res.json({ success: false, message: "Server error" })
  }
})

// Delete account
app.delete("/api/users/:userId", (req, res) => {
  const { userId } = req.params
  const { password } = req.body

  if (!userId || !password) {
    return res.json({ success: false, message: "User ID and password are required" })
  }

  try {
    // Read users from file
    let users = []
    try {
      const usersData = fs.readFileSync(USERS_FILE, "utf8")
      users = JSON.parse(usersData)
    } catch (err) {
      console.log("Error reading users file or empty file")
      return res.json({ success: false, message: "Error reading users file" })
    }

    // Find user
    const userIndex = users.findIndex((u) => u.id === userId)

    if (userIndex === -1) {
      return res.json({ success: false, message: "User not found" })
    }

    // Check password
    const hashedPassword = hashPassword(password)
    if (users[userIndex].password !== hashedPassword) {
      return res.json({ success: false, message: "Password is incorrect" })
    }

    // Delete profile picture if exists
    if (users[userIndex].profilePicture) {
      const picturePath = path.join(UPLOADS_DIR, path.basename(users[userIndex].profilePicture))
      if (fs.existsSync(picturePath)) {
        fs.unlinkSync(picturePath)
      }
    }

    // Remove user
    users.splice(userIndex, 1)

    // Save to file
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))

    // Remove user from online users
    ONLINE_USERS.delete(userId)

    res.json({ success: true, message: "Account deleted successfully" })
  } catch (error) {
    console.error("Error deleting account:", error)
    res.json({ success: false, message: "Server error" })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Users file path: ${USERS_FILE}`)
})

