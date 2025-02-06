// Fetch the JSON configuration
fetch('./main.json')
  .then(response => response.json())
  .then(data => {
    // Populate the menu
    const menu = document.getElementById('menu');
    for (const [text, link] of Object.entries(data.mainMenu)) {
      const button = document.createElement('a');
      button.href = link;
      button.textContent = text;
      button.classList.add('menu-button');
      menu.appendChild(button);
    }

    // Populate the header
    const header = document.getElementById('header');
    header.textContent = data.header;

    // Populate the footer
    const footer = document.getElementById('footer');
    const currentYear = new Date().getFullYear();
    footer.textContent = data.footer.replace('${year}', currentYear);

    // Populate the body
    const bodyContent = document.getElementById('body-content');
    bodyContent.textContent = data.body;
  })
  .catch(error => {
    console.error('Error loading JSON:', error);
  });
