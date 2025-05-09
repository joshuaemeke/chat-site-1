document.addEventListener("DOMContentLoaded", () => {
  console.log("Signup page loaded")

  // Check if user is already logged in
  const currentUser = localStorage.getItem("currentUser")
  if (currentUser) {
    // Redirect to home if already logged in
    window.location.href = "home.html"
    return
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
        console.log("Sending register request:", { username, email })

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

            // Redirect to login page
            window.location.href = "index.html"
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
})

