const menuList = document.getElementById("menu-list");
const settings = document.getElementById("settings");
const serverIpInput = document.getElementById("server-ip");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
let focusedIndex = 0;

const menuItems = Array.from(menuList.children);

function updateFocus() {
  menuItems.forEach((item, index) => {
    item.classList.toggle("focused", index === focusedIndex);
  });
  // اسکرول به آیتم فوکوس‌شده
  const focusedItem = menuItems[focusedIndex];
  focusedItem.scrollIntoView({ behavior: "smooth", block: "center" });
}

function saveConfig() {
  const serverIp = serverIpInput.value.trim();
  const user = usernameInput.value.trim();
  const pass = passwordInput.value.trim();

  if (!serverIp || !user || !pass) {
    alert("لطفاً همه فیلدها را پر کنید!");
    return;
  }

  const formattedServerIp = serverIp.startsWith("http://") ? serverIp : `http://${serverIp}`;
  localStorage.setItem("serverIp", formattedServerIp);
  localStorage.setItem("username", user);
  localStorage.setItem("password", pass);

  settings.classList.remove("visible");
  window.location.href = "live.html";
}

function loadWeather() {
  const apiKey = "YOUR_OPENWEATHER_API_KEY"; // کلید API خودت رو بذار
  const city = "Tehran";
  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=fa`)
    .then(response => response.json())
    .then(data => {
      const temp = data.main.temp;
      const description = data.weather[0].description;
      let icon = "☁️"; // پیش‌فرض
      if (description.includes("آفتاب")) icon = "☀️";
      else if (description.includes("باران")) icon = "🌧️";
      else if (description.includes("برف")) icon = "❄️";
      else if (description.includes("ابری")) icon = "⛅";
      document.getElementById("weather-icon").textContent = icon;
      document.getElementById("weather-info").textContent = `${temp}°C - ${description}`;
    })
    .catch(() => {
      document.getElementById("weather-info").textContent = "خطا";
    });
}

function updateClock() {
  const now = new Date();
  const options = { hour: "2-digit", minute: "2-digit", hour12: false };
  const time = now.toLocaleTimeString("fa-IR", options);
  const date = now.toLocaleDateString("fa-IR");
  document.getElementById("clock-time").textContent = `${time} - ${date}`;
}
setInterval(updateClock, 1000);

document.addEventListener("keydown", (event) => {
  if (settings.classList.contains("visible")) {
    if (event.key === "Escape" || event.key === "Back") {
      settings.classList.remove("visible");
      event.preventDefault();
    }
    return;
  }

  if (event.key === "ArrowUp" || event.keyCode === 38) {
    if (focusedIndex > 0) {
      focusedIndex--;
      updateFocus();
    }
    event.preventDefault();
  } else if (event.key === "ArrowDown" || event.keyCode === 40) {
    if (focusedIndex < menuItems.length - 1) {
      focusedIndex++;
      updateFocus();
    }
    event.preventDefault();
  } else if (event.key === "Enter" || event.key === "Ok" || event.keyCode === 13) {
    if (menuItems[focusedIndex].dataset.section === "live") {
      const hasConfig = localStorage.getItem("serverIp") && localStorage.getItem("username") && localStorage.getItem("password");
      if (hasConfig) {
        window.location.href = "live.html";
      } else {
        settings.classList.add("visible");
      }
    }
    event.preventDefault();
  } else if (event.key === "Back" || event.key === "Escape") {
    event.preventDefault();
  } else if (event.key === "s" && event.ctrlKey) {
    settings.classList.add("visible");
    event.preventDefault();
  }
});

updateFocus();
loadWeather();
updateClock();