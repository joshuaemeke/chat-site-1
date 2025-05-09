document.addEventListener("DOMContentLoaded", () => {
  console.log("Login page loaded")

  // Check if user is already logged in
  const currentUser = localStorage.getItem("currentUser")
  if (currentUser) {
    // Redirect to home if already logged in
    window.location.href = "home.html"
    return
  }

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
        console.log("Sending login request:", { username })

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

          // Store user info in localStorage
          localStorage.setItem("currentUser", JSON.stringify(data.user))

          // Add success animation to form
          loginForm.classList.add("success-animation")

          setTimeout(() => {
            // Redirect to home page
            window.location.href = "home.html"
          }, 1000)
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
})

