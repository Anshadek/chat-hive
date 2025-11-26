document.getElementById("signinBtn").addEventListener("click", signin);

async function signin() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("msg");

  msg.textContent = "";

  if (!email || !password) {
    msg.textContent = "Email & Password required";
    return;
  }

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!data.status || !data.token) {
      msg.textContent = data.message || "Invalid login";
      return;
    }

    // Save token
    localStorage.setItem("token", data.token);

    // Go to chat
    window.location.href = "/chat.html";
  } catch (err) {
    msg.textContent = "Something went wrong!";
  }
}
