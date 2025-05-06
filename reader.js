/* reader.js - Chapter Reader with Dynamic Discovery, Navigation, and Persistence */

const params = new URLSearchParams(window.location.search);
const storyPath = params.get("story");
let chapter = parseInt(params.get("chapter") || "1");

const chapterCacheKey = `chapterCache_${storyPath}`;
let lastKnownChapter = parseInt(localStorage.getItem(chapterCacheKey) || "0");

const readerRoot = document.getElementById("reader");
const storyPickerRoot = document.getElementById("story-picker");

// Reader-specific cookie helpers to avoid collision with main.js
function setReaderCookie(name, value, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `reader_${name}=${value}; expires=${expires}; path=/`;
}

function getReaderCookie(name) {
  const cookies = document.cookie.split("; ");
  const cookie = cookies.find(row => row.startsWith(`reader_${name}=`));
  return cookie ? cookie.split("=")[1] : null;
}

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
    <div class="font-controls">
      <button class="font-decrease">➖</button>
      <button class="font-reset">🔁</button>
      <button class="font-increase">➕</button>
    </div>
  `;
  const navTop = document.createElement("div");
  navTop.innerHTML = navHTML;
  const navBottom = navTop.cloneNode(true);

  readerRoot.insertAdjacentElement("beforebegin", navTop);
  readerRoot.insertAdjacentElement("afterend", navBottom);
}

// Font size logic
function updateFontSize(delta = 0) {
  const current = parseFloat(getReaderCookie("fontSize")) || 1;
  const newSize = Math.max(0.7, Math.min(2.0, current + delta));
  setReaderCookie("fontSize", newSize.toFixed(2));
  readerRoot.style.setProperty("font-size", `${newSize}em`);
}

function bindNavigationEvents() {
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

  document.querySelectorAll(".font-increase").forEach(btn => btn.onclick = () => updateFontSize(0.1));
  document.querySelectorAll(".font-decrease").forEach(btn => btn.onclick = () => updateFontSize(-0.1));
  document.querySelectorAll(".font-reset").forEach(btn => btn.onclick = () => updateFontSize(0));
}

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

async function loadChapter(n) {
  try {
    const res = await fetch(`${storyPath}/chapt${n}.xml`);
    if (!res.ok) throw new Error("Chapter not found");
    const xmlText = await res.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");

    const paras = Array.from(xmlDoc.getElementsByTagName("w:p"));
    const htmlContent = paras.map(p => {
      const pPr = p.getElementsByTagName("w:pPr")[0];
      let style = "";
      if (pPr) {
        const styleEl = pPr.getElementsByTagName("w:pStyle")[0];
        if (styleEl) style = styleEl.getAttribute("w:val") || "";
      }

      let tag = "p";
      let className = "reader-paragraph";
      if (style === "Title") {
        tag = "h1";
        className = "reader-title";
      } else if (style === "Heading1" || style === "Heading2") {
        tag = "h2";
        className = "reader-subtitle";
      } else if (style === "Quote") {
        tag = "blockquote";
        className = "reader-quote";
      } else if (style === "IntenseQuote") {
        tag = "blockquote";
        className = "reader-quote reader-intense";
      }

      const runs = Array.from(p.getElementsByTagName("w:r")).map(run => {
        const text = Array.from(run.getElementsByTagName("w:t")).map(t => t.textContent).join("");

        const rPr = run.getElementsByTagName("w:rPr")[0];
        let spanClass = [];

        if (rPr) {
          if (rPr.getElementsByTagName("w:b").length) spanClass.push("reader-bold");
          if (rPr.getElementsByTagName("w:i").length) spanClass.push("reader-italic");
          if (rPr.getElementsByTagName("w:u").length) spanClass.push("reader-underline");
          if (rPr.getElementsByTagName("w:strike").length) spanClass.push("reader-strike");
          if (rPr.getElementsByTagName("w:smallCaps").length) spanClass.push("reader-smallcaps");
        }

        return `<span class="${spanClass.join(" ")}">${text}</span>`;
      }).join("");

      return `<${tag} class="${className}">${runs}</${tag}>`;
    }).join("\n");

    readerRoot.innerHTML = htmlContent;
    chapter = n;
    updateNav();
    setReaderCookie(`bookmark_${encodeURIComponent(storyPath)}`, chapter);
    window.scrollTo(0, 0);
  } catch (err) {
    readerRoot.innerHTML = `
      <div class="chapter-404">
        <h2>📕 Chapter ${n} Not Found</h2>
        <p>Looks like this XML chapter doesn't exist yet.</p>
      </div>
    `;
    console.error(err);
  }
}

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

function jumpTo(n) {
  window.location.search = `?story=${encodeURIComponent(storyPath)}&chapter=${n}`;
}

function updateNav() {
  document.querySelectorAll(".chapter-display").forEach(el => el.value = chapter);
  document.querySelectorAll(".chapter-end").forEach(btn => btn.textContent = lastKnownChapter);
  document.querySelectorAll(".btn-prev").forEach(btn => btn.disabled = chapter === 1);
  document.querySelectorAll(".btn-next").forEach(btn => btn.disabled = chapter === lastKnownChapter);
}

async function initReader() {
  await populateStoryPicker();
  if (!storyPath) return;

  injectNav();
  bindNavigationEvents();

  if (!lastKnownChapter) lastKnownChapter = await discoverChapters();

  if (!params.get("chapter")) {
    const bookmark = parseInt(getReaderCookie(`bookmark_${encodeURIComponent(storyPath)}`));
    if (bookmark && bookmark <= lastKnownChapter) chapter = bookmark;
  }

  await loadChapter(chapter);

  const initialFont = parseFloat(getReaderCookie("fontSize")) || 1;
  readerRoot.style.setProperty("font-size", `${initialFont}em`);
}

initReader();
