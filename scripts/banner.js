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

function scaleBannerToFit(maxHeight = 250) {
    const wrapper = document.getElementById('banner-wrapper');
    const banner = document.getElementById('banner');

    // Reset any previous scaling
    banner.style.transform = '';
    banner.style.transformOrigin = 'top left';

    const actualHeight = banner.offsetHeight;

    if (actualHeight > maxHeight) {
        const scaleFactor = maxHeight / actualHeight;
        banner.style.transform = `scale(${scaleFactor})`;
    }
}