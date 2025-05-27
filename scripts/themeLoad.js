(() => {
  const match = document.cookie.match(/(?:^| )darkMode=(true|false)/);
  const isDark = match?.[1] === "true";
  document.documentElement.classList.add(isDark ? "dark-mode" : "light-mode");
})();
