
const API = ABYSS_CONFIG.API_BASE;

let apiKey = sessionStorage.getItem("abyss_api_key") || "";

async function request(endpoint, options = {}) {
  const response = await fetch(`${API}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-ABYSS-KEY": apiKey,
      ...(options.headers || {})
    }
  });

  if (response.status === 401) {
    sessionStorage.removeItem("abyss_api_key");
    apiKey = "";
    throw new Error("Chave de acesso inválida ou expirada.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Erro ao comunicar com o servidor.");
  }

  return data;
}

async function connectDashboard() {
  if (!apiKey) {
    apiKey = prompt("Digite sua chave de acesso ABYSS:");
    if (!apiKey) return;
    sessionStorage.setItem("abyss_api_key", apiKey);
  }

  try {
    await request("/api/me");
    await loadDashboard();
    await loadChannels();
    await loadSettings();
  } catch (error) {
    alert(error.message);
    sessionStorage.removeItem("abyss_api_key");
    apiKey = "";
  }
}

async function loadDashboard() {
  try {
    const data = await request("/api/posts");

    const posts = data.posts || [];

    document.getElementById("totalPosts").textContent = posts.length;

    document.getElementById("totalLikes").textContent =
      posts.reduce((total, post) => total + (post.likes?.length || 0), 0);

    document.getElementById("totalComments").textContent =
      posts.reduce((total, post) => total + (post.comments?.length || 0), 0);

    renderPosts(posts);
  } catch (error) {
    console.error(error);
  }
}

function renderPosts(posts) {
  const container = document.getElementById("posts");

  if (!posts.length) {
    container.innerHTML = '<p class="empty">Nenhuma publicação encontrada.</p>';
    return;
  }

  container.innerHTML = posts.map(post => {
    const media = post.mediaUrl
      ? `<img src="${escapeHTML(post.mediaUrl)}" alt="Mídia da publicação">`
      : "";

    return `
      <article class="post-card">
        ${media}
        <div class="post-info">
          <strong>${escapeHTML(post.authorName || "Usuário")}</strong>
          <p>${escapeHTML(post.caption || "Sem legenda")}</p>
          <div class="post-numbers">
            <span>♥ ${post.likes?.length || 0}</span>
            <span>▢ ${post.comments?.length || 0}</span>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

async function loadChannels() {
  try {
    const data = await request("/api/channels");
    const select = document.getElementById("channelId");

    select.innerHTML = '<option value="">Selecione um canal</option>';

    (data.channels || []).forEach(channel => {
      const option = document.createElement("option");
      option.value = channel.id;
      option.textContent = `#${channel.name}`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error(error);
  }
}

async function loadSettings() {
  try {
    const data = await request("/api/settings");
    const settings = data.settings || {};

    document.getElementById("profileName").value =
      settings.profileName || "ABYSS";

    document.getElementById("profileHandle").value =
      settings.profileHandle || "";

    document.getElementById("channelId").value =
      settings.channelId || "";

    document.getElementById("allowLikes").checked =
      settings.allowLikes !== false;

    document.getElementById("allowComments").checked =
      settings.allowComments !== false;

    document.getElementById("allowSharing").checked =
      settings.allowSharing !== false;
  } catch (error) {
    console.error(error);
  }
}

async function saveSettings() {
  const settings = {
    profileName: document.getElementById("profileName").value.trim(),
    profileHandle: document.getElementById("profileHandle").value.trim(),
    channelId: document.getElementById("channelId").value,
    allowLikes: document.getElementById("allowLikes").checked,
    allowComments: document.getElementById("allowComments").checked,
    allowSharing: document.getElementById("allowSharing").checked
  };

  try {
    await request("/api/settings", {
      method: "POST",
      body: JSON.stringify(settings)
    });

    alert("Configurações salvas com sucesso!");
  } catch (error) {
    alert(error.message);
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

connectDashboard();
