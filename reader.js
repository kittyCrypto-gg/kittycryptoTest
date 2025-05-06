const params = new URLSearchParams(window.location.search);
const storyPath = params.get("story");
let chapter = parseInt(params.get("chapter") || "1");

const chapterCacheKey = `chapterCache_${storyPath}`;
const chapterBookmarkKey = `chapterBookmark_${storyPath}`;
let lastKnownChapter = parseInt(localStorage.getItem(chapterCacheKey) || "0");

const readerRoot = document.getElementById("reader");
const storyPickerRoot = document.getElementById("story-picker");

// Inject navigation bars at top and bottom
function injectNav() {
  const navHTML = `
    <div class="chapter-navigation">
      <button class="btn-prev">⬅️</button>
      <input class="chapter-display" type="text" value="1" readonly style="width: 2ch; text-align: center; border: none; background: transparent; font-weight: bold;" />
      <input class="chapter-input" type="number" min="1" style="width: 2ch; text-align: center;" />
      <button class="btn-jump">🆗</button>
      <button class="chapter-end" disabled style="width: 2ch; text-align: center; font-weight: bold;"></button>
      <button class="btn-next">➡️</button>
      <button class="btn-rescan">🔃</button>
    </div>
  `;
  const navTop = document.createElement("div");
  navTop.innerHTML = navHTML;
  const navBottom = navTop.cloneNode(true);

  readerRoot.insertAdjacentElement("beforebegin", navTop);
  readerRoot.insertAdjacentElement("afterend", navBottom);
}

// Load available stories into dropdown
async function populateStoryPicker() {
  if (!storyPickerRoot) return;
  try {
    const res = await fetch("/stories.json");
    if (!res.ok) throw new Error("No stories found");
    const stories = await res.json();

    const select = document.createElement("select");
    select.className = "story-selector";
    select.innerHTML = `<option value="">Select a story...</option>`;
    Object.entries(stories).forEach(([name, path]) => {
      const opt = document.createElement("option");
      opt.value = path;
      opt.textContent = name;
      if (path === storyPath) opt.selected = true;
      select.appendChild(opt);
    });

    select.onchange = () => {
      if (select.value) {
        window.location.search = `?story=${encodeURIComponent(select.value)}&chapter=1`;
      }
    };

    storyPickerRoot.appendChild(select);
  } catch (err) {
    console.warn("No stories found or failed to load stories.json", err);
  }
}

// Load chapter HTML
async function loadChapter(n) {
  try {
    const res = await fetch(`${storyPath}/chapt${n}.html`);
    if (!res.ok) throw new Error("Chapter not found");
    const html = await res.text();
    readerRoot.innerHTML = new TextDecoder("utf-8").decode(new TextEncoder().encode(html));
    chapter = n;
    updateNav();
    localStorage.setItem(chapterBookmarkKey, chapter);
    window.scrollTo(0, 0);
  } catch (err) {
    readerRoot.innerHTML = `
      <div class="chapter-404">
        <h2>📕 Chapter ${n} Not Found</h2>
        <p>It looks like this chapter doesn't exist yet. Maybe it's still being written—or maybe you’ve discovered a void in the story timeline.</p>
      </div>
    `;
    console.error(err);
  }
}

// Discover chapters until 404
async function discoverChapters() {
  let i = 1;
  while (true) {
    try {
      const path = `${storyPath}/chapt${i}.html`;
      console.log(`reading chapter ${i} in ${path}`);
      const res = await fetch(path, { method: "HEAD" });
      if (!res.ok) break;
      i++;
    } catch (err) {
      console.error(`Error at chapt${i}:`, err);
      break;
    }
  }
  const last = i - 1;
  localStorage.setItem(chapterCacheKey, last);
  return last;
}

// Jump to chapter
function jumpTo(n) {
  window.location.search = `?story=${encodeURIComponent(storyPath)}&chapter=${n}`;
}

// Update navigation controls
function updateNav() {
  document.querySelectorAll(".chapter-display").forEach(el => el.value = chapter);
  document.querySelectorAll(".chapter-end").forEach(btn => btn.textContent = lastKnownChapter);
  document.querySelectorAll(".btn-prev").forEach(btn => btn.disabled = chapter === 1);
  document.querySelectorAll(".btn-next").forEach(btn => btn.disabled = chapter === lastKnownChapter);
}

// Initialiser
async function initReader() {
  await populateStoryPicker();
  if (!storyPath) return;

  injectNav();
  if (!lastKnownChapter) lastKnownChapter = await discoverChapters();

  if (!params.get("chapter")) {
    const bookmark = parseInt(localStorage.getItem(chapterBookmarkKey));
    if (bookmark && bookmark <= lastKnownChapter) chapter = bookmark;
  }

  await loadChapter(chapter);

  document.querySelectorAll(".btn-prev").forEach(btn => btn.onclick = () => {
    if (chapter > 1) jumpTo(chapter - 1);
  });

  document.querySelectorAll(".btn-next").forEach(btn => btn.onclick = () => {
    if (chapter < lastKnownChapter) jumpTo(chapter + 1);
  });

  document.querySelectorAll(".btn-jump").forEach(btn => btn.onclick = () => {
    document.querySelectorAll(".chapter-input").forEach(input => {
      const val = parseInt(input.value);
      if (val >= 1 && val <= lastKnownChapter) jumpTo(val);
    });
  });

  document.querySelectorAll(".chapter-input").forEach(input => {
    input.value = chapter;
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const val = parseInt(e.target.value);
        if (val >= 1 && val <= lastKnownChapter) jumpTo(val);
      }
    });
  });

  document.querySelectorAll(".btn-rescan").forEach(btn => btn.onclick = async () => {
    localStorage.removeItem(chapterCacheKey);
    lastKnownChapter = await discoverChapters();
    updateNav();
  });
}

initReader();
