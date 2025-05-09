document.addEventListener("DOMContentLoaded", () => {
  // Get elements
  const messageElement = document.getElementById("message")
  const getMessageButton = document.getElementById("getMessage")

  // Function to fetch message from the server
  const fetchMessage = async () => {
    try {
      messageElement.textContent = "Loading..."

      const response = await fetch("/api/message")

      if (!response.ok) {
        throw new Error("Network response was not ok")
      }

      const data = await response.json()
      messageElement.textContent = data.message
    } catch (error) {
      console.error("Error fetching message:", error)
      messageElement.textContent = "Failed to load message from server"
    }
  }

  // Fetch message when page loads
  fetchMessage()

  // Add event listener to button
  getMessageButton.addEventListener("click", fetchMessage)

  // Tab switching functionality
  const tabs = document.querySelectorAll(".tab")
  const formSections = document.querySelectorAll(".form-section")

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Remove active class from all tabs and sections
      tabs.forEach((t) => t.classList.remove("active"))
      formSections.forEach((s) => s.classList.remove("active"))

      // Add active class to clicked tab and corresponding section
      tab.classList.add("active")
      const tabId = tab.getAttribute("data-tab")
      document.getElementById(tabId).classList.add("active")

      // Clear messages
      document.querySelectorAll(".message").forEach((m) => {
        m.textContent = ""
        m.className = "message"
      })
    })
  })

  // Login form submission
  const loginForm = document.getElementById("login-form")
  const loginMessage = document.getElementById("login-message")

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      console.log("Login form submitted")

      const username = document.getElementById("login-username").value.trim()
      const password = document.getElementById("login-password").value

      if (!username || !password) {
        showMessage(loginMessage, "Please fill in all fields", "error")
        shakeForm(loginForm)
        return
      }

      const submitBtn = loginForm.querySelector(".btn-submit")
      const btnText = submitBtn.querySelector(".btn-text")
      const originalText = btnText.textContent

      // Show loading state
      btnText.textContent = "Logging in..."
      submitBtn.disabled = true
      submitBtn.style.opacity = "0.7"

      try {
        console.log("Sending login request:", { username, password })

        const response = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        })

        console.log("Login response status:", response.status)
        const data = await response.json()
        console.log("Login response data:", data)

        if (data.success) {
          showMessage(loginMessage, "Login successful!", "success")

          // Add success animation to form
          loginForm.classList.add("success-animation")

          setTimeout(() => {
            // Show welcome message
            alert(`Welcome back, ${data.user.username}!`)

            // Reset form
            loginForm.reset()
            loginForm.classList.remove("success-animation")
          }, 1500)
        } else {
          showMessage(loginMessage, data.message || "Login failed", "error")
          shakeForm(loginForm)
        }
      } catch (error) {
        console.error("Login error:", error)
        showMessage(loginMessage, "Server error. Please try again later.", "error")
        shakeForm(loginForm)
      } finally {
        // Restore button state
        btnText.textContent = originalText
        submitBtn.disabled = false
        submitBtn.style.opacity = "1"
      }
    })
  } else {
    console.error("Login form not found")
  }

  // Registration form submission
  const registerForm = document.getElementById("register-form")
  const registerMessage = document.getElementById("register-message")

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      console.log("Register form submitted")

      const username = document.getElementById("register-username").value.trim()
      const email = document.getElementById("register-email").value.trim()
      const password = document.getElementById("register-password").value
      const confirmPassword = document.getElementById("register-confirm").value

      if (!username || !email || !password || !confirmPassword) {
        showMessage(registerMessage, "Please fill in all fields", "error")
        shakeForm(registerForm)
        return
      }

      if (password !== confirmPassword) {
        showMessage(registerMessage, "Passwords do not match", "error")
        shakeForm(registerForm)
        return
      }

      if (password.length < 6) {
        showMessage(registerMessage, "Password must be at least 6 characters", "error")
        shakeForm(registerForm)
        return
      }

      const submitBtn = registerForm.querySelector(".btn-submit")
      const btnText = submitBtn.querySelector(".btn-text")
      const originalText = btnText.textContent

      // Show loading state
      btnText.textContent = "Registering..."
      submitBtn.disabled = true
      submitBtn.style.opacity = "0.7"

      try {
        console.log("Sending register request:", { username, email, password })

        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        })

        console.log("Register response status:", response.status)
        const data = await response.json()
        console.log("Register response data:", data)

        if (data.success) {
          showMessage(registerMessage, "Registration successful!", "success")

          // Add success animation to form
          registerForm.classList.add("success-animation")

          setTimeout(() => {
            // Reset form
            registerForm.reset()
            registerForm.classList.remove("success-animation")

            // Switch to login tab
            document.querySelector('[data-tab="login"]').click()
          }, 1500)
        } else {
          showMessage(registerMessage, data.message || "Registration failed", "error")
          shakeForm(registerForm)
        }
      } catch (error) {
        console.error("Registration error:", error)
        showMessage(registerMessage, "Server error. Please try again later.", "error")
        shakeForm(registerForm)
      } finally {
        // Restore button state
        btnText.textContent = originalText
        submitBtn.disabled = false
        submitBtn.style.opacity = "1"
      }
    })
  } else {
    console.error("Register form not found")
  }

  // Helper function to show messages
  function showMessage(element, text, type) {
    if (!element) {
      console.error("Message element not found")
      return
    }

    element.textContent = text
    element.className = `message ${type}`

    // Auto-hide success messages after 5 seconds
    if (type === "success") {
      setTimeout(() => {
        element.textContent = ""
        element.className = "message"
      }, 5000)
    }
  }

  // Helper function to shake form on error
  function shakeForm(form) {
    if (!form) {
      console.error("Form element not found")
      return
    }

    form.classList.add("shake")
    setTimeout(() => {
      form.classList.remove("shake")
    }, 500)
  }

  // Add shake animation CSS
  const style = document.createElement("style")
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    .shake {
      animation: shake 0.5s;
    }
    
    @keyframes success-pulse {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
    
    .success-animation {
      animation: success-pulse 1.5s;
    }
  `
  document.head.appendChild(style)

  // Debug info
  console.log("DOM fully loaded")
  console.log("Login form:", loginForm)
  console.log("Register form:", registerForm)
})

