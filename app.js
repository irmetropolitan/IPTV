const channelList = document.getElementById("channel-list");
const player = document.getElementById("player");
const serverIpInput = document.getElementById("server-ip"); // این توی live.html نیست، پس null می‌شه
const usernameInput = document.getElementById("username"); // اینم null می‌شه
const passwordInput = document.getElementById("password"); // اینم null می‌شه
const configForm = document.getElementById("config-form"); // اینم null می‌شه
const sidebar = document.getElementById("sidebar");
const searchBox = document.getElementById("search-box");

let tvheadendUrl = "";
let username = "";
let password = "";
let currentChannel = null;
let channels = [];
let filteredChannels = [];
let focusedIndex = -1;
let numberInput = "";

// بارگذاری اطلاعات ذخیره‌شده
function loadSavedConfig() {
  const savedServerIp = localStorage.getItem("serverIp");
  const savedUsername = localStorage.getItem("username");
  const savedPassword = localStorage.getItem("password");

  console.log("Loading config:", { savedServerIp, savedUsername, savedPassword }); // دیباگ

  if (savedServerIp && savedUsername && savedPassword) {
    tvheadendUrl = savedServerIp;
    username = savedUsername;
    password = savedPassword;
    // چون توی live.html فرم نداریم، مستقیم می‌ریم سراغ کانال‌ها
    searchBox.style.display = "block";
    channelList.style.display = "block";
    loadChannels();
  } else {
    alert("تنظیمات یافت نشد! لطفاً از صفحه اصلی تنظیمات را وارد کنید.");
    window.location.href = "index.html"; // برگشت به Intro اگه تنظیمات نباشه
  }
}

async function fetchChannels() {
  try {
    console.log("Fetching channels from:", `${tvheadendUrl}/api/channel/grid?limit=999999`); // دیباگ
    const response = await fetch(`${tvheadendUrl}/api/channel/grid?limit=999999`, {
      headers: {
        Authorization: "Basic " + btoa(`${username}:${password}`),
      },
    });
    if (!response.ok) throw new Error(`خطا در پاسخ سرور: ${response.status}`);
    const data = await response.json();
    console.log("Channels fetched:", data.entries); // دیباگ
    return data.entries;
  } catch (error) {
    console.error("Error fetching channels:", error); // دیباگ
    alert(`خطا در دریافت کانال‌ها: ${error.message}`);
    searchBox.style.display = "none";
    channelList.style.display = "none";
    sidebar.classList.add("visible");
    return [];
  }
}

async function loadChannels() {
  channels = await fetchChannels();
  filteredChannels = [...channels];
  if (channels.length === 0) {
    channelList.innerHTML = "<li>هیچ کانالی یافت نشد</li>";
    return;
  }
  renderChannels();
}

function renderChannels() {
  channelList.innerHTML = "";
  filteredChannels.forEach((channel, index) => {
    const li = document.createElement("li");
    li.textContent = channel.name || "کانال بدون نام";
    li.dataset.uuid = channel.uuid;
    li.dataset.index = index;
    if (index === focusedIndex) li.classList.add("focused");
    if (channel.uuid === currentChannel) li.classList.add("active");
    li.addEventListener("click", () => {
      playChannel(channel.uuid);
      sidebar.classList.remove("visible");
    });
    channelList.appendChild(li);
  });
}

async function playChannel(channelUuid) {
  if (currentChannel === channelUuid) return;

  const streamUrl = `${tvheadendUrl}/stream/channel/${channelUuid}?profile=mpegts`; // یا بدون پروفایل
  currentChannel = channelUuid;

  try {
    player.pause();
    player.src = "";
    player.load();

    const response = await fetch(streamUrl, {
      method: "HEAD",
      headers: {
        Authorization: "Basic " + btoa(`${username}:${password}`),
      },
    });
    if (!response.ok) throw new Error(`استریم در دسترس نیست: ${response.status}`);

    player.src = streamUrl;
    player.play().catch(error => {
      currentChannel = null;
      alert(`خطا در پخش ویدئو: ${error.message}`);
    });
    renderChannels();
    sidebar.classList.remove("visible");
  } catch (error) {
    currentChannel = null;
    alert(`خطا در پخش استریم: ${error.message}`);
    sidebar.classList.remove("visible");
  }
}

function filterChannels(query) {
  filteredChannels = channels.filter(channel =>
    (channel.name || "کانال بدون نام").toLowerCase().includes(query.toLowerCase())
  );
  focusedIndex = filteredChannels.length > 0 ? 0 : -1;
  renderChannels();
}

// کنترل با کیبورد و ریموت
document.addEventListener("keydown", (event) => {
  const isSidebarVisible = sidebar.classList.contains("visible");

  if (event.key === "Escape" || event.key === "Back") {
    sidebar.classList.remove("visible");
    numberInput = "";
    event.preventDefault();
    return;
  }

  if (event.key === "Enter" || event.key === "Ok" || event.keyCode === 13) {
    if (!isSidebarVisible) {
      sidebar.classList.add("visible");
      focusedIndex = filteredChannels.findIndex(ch => ch.uuid === currentChannel) || 0;
      renderChannels();
    } else if (focusedIndex >= 0) {
      const selectedChannel = filteredChannels[focusedIndex];
      playChannel(selectedChannel.uuid);
    }
    event.preventDefault();
    return;
  }

  if (!isSidebarVisible) {
    if (event.key === "ArrowUp" || event.keyCode === 38) {
      const currentIndex = channels.findIndex(ch => ch.uuid === currentChannel);
      if (currentIndex > 0) playChannel(channels[currentIndex - 1].uuid);
      event.preventDefault();
    } else if (event.key === "ArrowDown" || event.keyCode === 40) {
      const currentIndex = channels.findIndex(ch => ch.uuid === currentChannel);
      if (currentIndex < channels.length - 1) playChannel(channels[currentIndex + 1].uuid);
      event.preventDefault();
    }
    return;
  }

  if (event.key === "ArrowUp" || event.keyCode === 38) {
    if (focusedIndex > 0) {
      focusedIndex--;
      renderChannels();
    }
    event.preventDefault();
  } else if (event.key === "ArrowDown" || event.keyCode === 40) {
    if (focusedIndex < filteredChannels.length - 1) {
      focusedIndex++;
      renderChannels();
    }
    event.preventDefault();
  } else if (/^\d$/.test(event.key)) {
    numberInput += event.key;
    setTimeout(() => {
      const channelNumber = parseInt(numberInput) - 1;
      if (channelNumber >= 0 && channelNumber < filteredChannels.length) {
        focusedIndex = channelNumber;
        playChannel(filteredChannels[focusedIndex].uuid);
      }
      numberInput = "";
    }, 1000);
  }
});

// فیلتر با جستجو
searchBox.addEventListener("input", (event) => {
  filterChannels(event.target.value);
});

// شروع
loadSavedConfig();