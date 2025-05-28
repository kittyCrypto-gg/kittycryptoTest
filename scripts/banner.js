export async function loadBanner() {
    const container = document.getElementById('banner');

    const promptRow = document.createElement('div');
    promptRow.classList.add('row');
    const prompt = document.createElement('span');
    prompt.classList.add('command-line');
    prompt.innerHTML = '<span class="green">kitty@kittycrypto</span><span class="blue">:~</span><span class="teal">$ neofetch</span>';
    promptRow.appendChild(prompt);
    container.appendChild(promptRow);

    const isDark = document.documentElement.classList.contains('dark-mode');
    const asciiPath = isDark ? 'images/miku-dark.txt' : 'images/miku-light.txt';
    const response = await fetch(asciiPath);

    const asciiText = await response.text();
    const asciiLines = asciiText.trim().split('\n');

    const contentRow = document.createElement('div');
    contentRow.classList.add('row', 'content');

    const asciiBlock = document.createElement('div');
    asciiBlock.classList.add('ascii-block');
    asciiLines.forEach(line => {
        const span = document.createElement('span');
        span.classList.add('ascii-line');
        span.textContent = line;
        asciiBlock.appendChild(span);
        asciiBlock.appendChild(document.createElement('br'));
    });

    const infoBlock = document.createElement('div');
    infoBlock.classList.add('info-block');
    const infoLines = [
        'HatsuneMikuOS V 2.01',
        '----------------------',
        'User: Kitty (she/her)',
        'Host: CRT-iMac (teal)',
        'DE: Nekomimi-kawaii',
        'WM: Miku.Moe',
        'Terminal: YuriGreen Terminal Emulator',
        'Uptime: since 1991',
        'Sbin: bin/viewneko.coffee',
        'Bash: /bin/purr',
        'Battery: 69% (charging by longing)',
        'GPU: NVIDIA RTX 5090 MikuCore 36.3 GiB',
        'Memory: 119.21 GiB DDR5',
        '~* this system purrs for catgirls *~'
    ];
    infoLines.forEach((line, i) => {
        const span = document.createElement('span');
        span.classList.add('info-line');
        if (i === 0) span.classList.add('info-header');
        if (i === infoLines.length - 1) span.classList.add('info-footer');
        span.textContent = line;
        infoBlock.appendChild(span);
        infoBlock.appendChild(document.createElement('br'));
    });

    contentRow.appendChild(asciiBlock);
    contentRow.appendChild(infoBlock);
    container.appendChild(contentRow);

    const cursorRow = document.createElement('div');
    cursorRow.classList.add('row');
    const cursor = document.createElement('span');
    cursor.classList.add('command-line');
    cursor.innerHTML = '<span class="green">kitty@kittycrypto</span><span class="blue">:~</span><span class="teal">$ </span><span class="cursor">█</span>';
    cursorRow.appendChild(cursor);
    container.appendChild(cursorRow);

    scaleBannerToFit(250);
    window.addEventListener('resize', () => scaleBannerToFit(250));
    observeThemeChange();
}

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function scaleBannerToFit(maxHeight = 250) {
    const wrapper = document.getElementById('banner-wrapper');
    const banner = document.getElementById('banner');

    banner.style.transform = '';
    banner.style.transformOrigin = 'top left'; // keep scaling aligned
    wrapper.style.overflow = 'visible'; // match new CSS

    const actualHeight = banner.offsetHeight;

    if (isMobileDevice() && actualHeight > maxHeight) {
        const scaleFactor = maxHeight / actualHeight;
        banner.style.transform = `scale(${scaleFactor})`;
    }
}

export async function setupTerminalWindow() {
    const terminalWrapper = document.getElementById('terminal-wrapper');
    const windowWrapper = document.createElement('div');
    windowWrapper.id = 'terminal-window';

    const header = document.createElement('div');
    header.id = 'terminal-header';

    const controls = document.createElement('div');
    controls.classList.add('window-controls');

    const closeBtn = document.createElement('span');
    closeBtn.classList.add('btn', 'close');
    closeBtn.textContent = '🔴';
    closeBtn.addEventListener('click', () => {
        windowWrapper.style.display = 'none';
        document.getElementById('term-icon').style.display = 'inline-block';
        localStorage.setItem('terminal-closed', 'true');
    });

    const minimizeBtn = document.createElement('span');
    minimizeBtn.classList.add('btn', 'minimize');
    minimizeBtn.textContent = '🟡';
    minimizeBtn.addEventListener('click', () => {
        terminalWrapper.style.display = 'none';
        minimizeBtn.classList.add('hidden');
        maximizeBtn.classList.remove('hidden');
        localStorage.setItem('terminal-minimised', 'true');
    });

    const maximizeBtn = document.createElement('span');
    maximizeBtn.classList.add('btn', 'maximize', 'hidden');
    maximizeBtn.textContent = '🟢';
    maximizeBtn.addEventListener('click', () => {
        terminalWrapper.style.display = 'block';
        maximizeBtn.classList.add('hidden');
        minimizeBtn.classList.remove('hidden');
        localStorage.removeItem('terminal-minimised');
    });

    const title = document.createElement('span');
    title.classList.add('window-title');
    title.textContent = 'YuriGreen Terminal Emulator — /home/kitty/';

    controls.appendChild(closeBtn);
    controls.appendChild(minimizeBtn);
    controls.appendChild(maximizeBtn);
    header.appendChild(controls);
    header.appendChild(title);

    windowWrapper.appendChild(header);
    windowWrapper.appendChild(terminalWrapper);

    const parent = document.getElementById('banner-wrapper');
    parent.insertBefore(windowWrapper, parent.firstChild);

    const icon = document.getElementById('term-icon');
    icon.src = '/images/terminal.svg';
    icon.alt = 'Terminal icon';
    icon.title = 'Double-click to open terminal';
    icon.addEventListener('dblclick', () => {
        windowWrapper.style.display = 'block';
        terminalWrapper.style.display = 'block';
        icon.style.display = 'none';
        localStorage.removeItem('terminal-closed');
        localStorage.removeItem('terminal-minimised');
    });

    makeIconDraggable();

    // Restore from localStorage
    if (localStorage.getItem('terminal-closed') === 'true') {
        windowWrapper.style.display = 'none';
        icon.style.display = 'inline-block';
    }

    if (localStorage.getItem('terminal-minimised') === 'true') {
        terminalWrapper.style.display = 'none';
        minimizeBtn.classList.add('hidden');
        maximizeBtn.classList.remove('hidden');
    }
}

function makeIconDraggable() {
    const icon = document.getElementById('term-icon');
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    icon.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - icon.offsetLeft;
        offsetY = e.clientY - icon.offsetTop;
        icon.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;
        icon.style.left = `${x}px`;
        icon.style.top = `${y}px`;
        localStorage.setItem('term-icon-x', icon.style.left);
        localStorage.setItem('term-icon-y', icon.style.top);
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            icon.style.cursor = 'grab';
        }
    });

    // Restore saved position if available
    const savedX = localStorage.getItem('term-icon-x');
    const savedY = localStorage.getItem('term-icon-y');
    if (savedX && savedY) {
        icon.style.left = savedX;
        icon.style.top = savedY;
    }
}

function observeThemeChange() {
    const target = document.documentElement;
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.attributeName === 'class') {
                updateAsciiArt();
                break;
            }
        }
    });

    observer.observe(target, { attributes: true });
}

async function updateAsciiArt() {
    const isDark = document.documentElement.classList.contains('dark-mode');
    const asciiPath = isDark ? 'images/miku-dark.txt' : 'images/miku-light.txt';
    const response = await fetch(asciiPath);
    const asciiText = await response.text();
    const asciiLines = asciiText.trim().split('\n');

    const asciiBlock = document.querySelector('.ascii-block');
    if (!asciiBlock) return;

    asciiBlock.innerHTML = ''; // clear previous lines
    asciiLines.forEach(line => {
        const span = document.createElement('span');
        span.classList.add('ascii-line');
        span.textContent = line;
        asciiBlock.appendChild(span);
        asciiBlock.appendChild(document.createElement('br'));
    });
}