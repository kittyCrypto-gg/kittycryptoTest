function setBannerTheme() {
    const dark = document.documentElement.classList.contains('dark-mode');
    const bannerLight = document.getElementById('banner-light');
    const bannerDark = document.getElementById('banner-dark');

    if (!bannerLight || !bannerDark) return;

    bannerLight.style.display = dark ? 'none' : 'block';
    bannerDark.style.display = dark ? 'block' : 'none';
}

// Run immediately if possible, or wait for DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setBannerTheme);
} else {
    setBannerTheme();
}

// Observe theme changes on <html>
const observer = new MutationObserver(setBannerTheme);
observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });