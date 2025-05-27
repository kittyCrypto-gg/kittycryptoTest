export function setBannerTheme() {
    const dark = document.documentElement.classList.contains('dark-mode');
    const bannerLight = document.getElementById('banner-light');
    const bannerDark = document.getElementById('banner-dark');

    if (!bannerLight || !bannerDark) return;

    bannerLight.style.display = dark ? 'none' : 'block';
    bannerDark.style.display = dark ? 'block' : 'none';
}

export const observer = new MutationObserver(setBannerTheme);