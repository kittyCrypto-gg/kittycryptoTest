export async function loadBanner() {
    const container = document.getElementById('banner');

    const promptRow = document.createElement('div');
    promptRow.classList.add('row');
    const prompt = document.createElement('span');
    prompt.classList.add('command-line');
    prompt.innerHTML = '<span class="green">kitty@kittycrypto</span><span class="blue">:~</span><span class="teal">$ neofetch</span>';
    promptRow.appendChild(prompt);
    container.appendChild(promptRow);

    const response = await fetch('images/miku.txt');
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
        'Memory: 19.2 GiB DDR fangirl',
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
}

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function scaleBannerToFit(maxHeight = 250) {
    const wrapper = document.getElementById('banner-wrapper');
    const banner = document.getElementById('banner');

    banner.style.transform = '';
    wrapper.style.maxHeight = '';
    wrapper.style.overflow = '';

    const actualHeight = banner.offsetHeight;

    if (isMobileDevice() && actualHeight > maxHeight) {
        const scaleFactor = maxHeight / actualHeight;
        banner.style.transform = `scale(${scaleFactor})`;
        wrapper.style.maxHeight = `${maxHeight}px`;
        wrapper.style.overflow = 'hidden';
    }
}

export function setupTerminalWindow() {
    const original = document.getElementById('terminal');
    const wrapper = document.createElement('div');
    wrapper.id = 'terminal-window';

    const header = document.createElement('div');
    header.id = 'terminal-header';

    const controls = document.createElement('div');
    controls.classList.add('window-controls');

    const closeBtn = document.createElement('span');
    closeBtn.classList.add('btn', 'close');
    closeBtn.textContent = '🔴';
    closeBtn.addEventListener('click', () => {
        wrapper.style.display = 'none';
        document.getElementById('icon').style.display = 'inline-block';
    });

    const minimizeBtn = document.createElement('span');
    minimizeBtn.classList.add('btn', 'minimize');
    minimizeBtn.textContent = '🟡';
    minimizeBtn.addEventListener('click', () => {
        document.getElementById('terminal-content').style.display = 'none';
        minimizeBtn.classList.add('hidden');
        maximizeBtn.classList.remove('hidden');
    });

    const maximizeBtn = document.createElement('span');
    maximizeBtn.classList.add('btn', 'maximize', 'hidden');
    maximizeBtn.textContent = '🟢';
    maximizeBtn.addEventListener('click', () => {
        document.getElementById('terminal-content').style.display = 'block';
        maximizeBtn.classList.add('hidden');
        minimizeBtn.classList.remove('hidden');
    });

    const title = document.createElement('span');
    title.classList.add('window-title');
    title.textContent = 'YuriGreen Terminal Emulator — /home/kitty/';

    controls.appendChild(closeBtn);
    controls.appendChild(minimizeBtn);
    controls.appendChild(maximizeBtn);
    header.appendChild(controls);
    header.appendChild(title);

    const content = document.createElement('div');
    content.id = 'terminal-content';

    wrapper.appendChild(header);
    wrapper.appendChild(content);

    const parent = original.parentNode;
    parent.replaceChild(wrapper, original);
    content.appendChild(original);

    // Handle icon double-click to restore
    const icon = document.getElementById('term-icon');
    icon.src = '/images/terminal.svg';
    icon.alt = 'Terminal icon';
    icon.addEventListener('dblclick', () => {
        wrapper.style.display = 'block';
        icon.style.display = 'none';
    });

    icon.title = "Double-click to open terminal";

    makeIconDraggable();
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