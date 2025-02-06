fetch('./main.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Loaded JSON data:', data); // Log data to verify
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

    // Populate the body
    const bodyContent = document.getElementById('main-content');
    if (!bodyContent) throw new Error('Element #main-content not found!');
    bodyContent.textContent = data.body;
  })
  .catch(error => {
    console.error('Error loading JSON or updating DOM:', error);
  });
