document.addEventListener("DOMContentLoaded", () => {
  document.body.style.visibility = "visible";
  document.body.style.opacity = "1";
});

let currentTheme = null;
// Function to get a cookie value
const getCookie = (name) => {
  const cookies = document.cookie.split("; ");
  const cookie = cookies.find(row => row.startsWith(`${name}=`));
  return cookie ? cookie.split("=")[1] : null;
};
// Function to set a cookie
const setCookie = (name, value, days = 365) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/`;
};
// Function to delete a cookie
const deleteCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
};
// Force page reflow to ensure theme change is immediately reflected
const repaint = () => {
  void document.body.offsetHeight;
};
// Load JSON file for UI elements
fetch('./main.json')
  .then(response => {
    if (!response.ok)
      throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  })
  .then(data => {
    // Inject any scripts defined in main.json into <head>
    if (data.headScripts) {
      data.headScripts.forEach(scriptContent => {
        const script = document.createElement("script");
        script.textContent = scriptContent;
        document.head.appendChild(script);
      });
    }
    // Populate the menu
    const menu = document.getElementById('main-menu');
    if (!menu) throw new Error('Element #main-menu not found!');
    for (const [text, link] of Object.entries(data.mainMenu)) {
      const button = document.createElement('a');
      button.href = link;
      button.textContent = text;
      button.classList.add('menu-button');
      menu.appendChild(button);
    }
    // Populate the header
    const header = document.getElementById('main-header');
    if (!header) throw new Error('Element #main-header not found!');
    header.textContent = data.header;
    // Populate the footer
    const footer = document.getElementById('main-footer');
    if (!footer) throw new Error('Element #main-footer not found!');
    const currentYear = new Date().getFullYear();
    footer.textContent = data.footer.replace('${year}', currentYear);
    // Theme Toggle Button
    const themeToggle = document.createElement("button");
    themeToggle.id = "theme-toggle";
    themeToggle.classList.add("theme-toggle-button");
    document.body.appendChild(themeToggle);
    // Explicit helpers
    const applyLightTheme = () => {
      document.documentElement.classList.remove("dark-mode");
      document.documentElement.classList.add("light-mode");
      themeToggle.textContent = data.themeToggle.light;
      setCookie("darkMode", "false");
      repaint();
      currentTheme = 'light';
      console.log("Applied light theme");
    };
    const applyDarkTheme = () => {
      document.documentElement.classList.remove("light-mode");
      document.documentElement.classList.add("dark-mode");
      themeToggle.textContent = data.themeToggle.dark;
      setCookie("darkMode", "true");
      repaint();
      currentTheme = 'dark';
      console.log("Applied dark theme");
    };
    // Set initial theme
    getCookie("darkMode") === "true" ? applyDarkTheme() : applyLightTheme();
    // Theme toggle event
    themeToggle.addEventListener("click", () => {
      if (currentTheme === 'light') {
        applyDarkTheme();
      } else if (currentTheme === 'dark') {
        applyLightTheme();
      } else {
        const isDark = document.body.classList.contains("dark-mode");
        isDark ? applyLightTheme() : applyDarkTheme();
        console.warn("currentTheme was null or invalid, fallback logic used.");
      }
    });
  })
  .catch(error => {
    console.error('Error loading JSON or updating DOM:', error);
  });
