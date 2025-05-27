function setBannerTheme() {
    const dark = document.body.classList.contains('dark-mode');
    const bannerLight = document.getElementById('banner-light');
    const bannerDark = document.getElementById('banner-dark');

    if (dark) {
        bannerLight.style.display = 'none';
        bannerDark.style.display = 'block';
    } else {
        bannerLight.style.display = 'block';
        bannerDark.style.display = 'none';
    }
}

// Run on load
document.addEventListener('DOMContentLoaded', setBannerTheme);

const observer = new MutationObserver(setBannerTheme);
observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });