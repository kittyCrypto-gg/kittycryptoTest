import { drawTriangularIdenticon } from './commitIdenticon.js';

async function fetchCommits(owner, repo, branch = 'main') {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}`;
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'web-client'
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = await response.json();
  return data.map(commit => ({
    sha: commit.sha,
    author: commit.commit.author.name,
    date: commit.commit.author.date,
    message: commit.commit.message,
    url: commit.html_url
  }));
}

async function renderCommits(commits, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = ''; // Clear previous content

  for (const commit of commits) {
    const div = document.createElement('div');
    div.className = 'commit-block';

    const identicon = await drawTriangularIdenticon(commit.sha, 36);

    const identiconWrapper = document.createElement('div');
    identiconWrapper.className = 'commit-identicon';
    identiconWrapper.appendChild(identicon);

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'commit-content';
    contentWrapper.innerHTML = `
      <div class="commit-message">${commit.message}</div>
      <div class="commit-meta">
        <span><strong>Author:</strong> ${commit.author}</span><br>
        <span><strong>Date:</strong> ${new Date(commit.date).toLocaleString()}</span><br>
        <span><strong>SHA:</strong> <code>${commit.sha}</code></span><br>
        <a href="${commit.url}" target="_blank">View on GitHub</a>
      </div>
    `;

    div.appendChild(identiconWrapper);
    div.appendChild(contentWrapper);
    container.appendChild(div);
  }
}

// Run on load:
(async () => {
  try {
    const frontendCommits = await fetchCommits('kittyCrypto-gg', 'kittycrypto');
    await renderCommits(frontendCommits, 'github-commits-frontend');
  } catch (err) {
    document.getElementById('github-commits').textContent = 'Error: ' + err.message;
  }

  try {
    const backendCommits = await fetchCommits('kittyCrypto-gg', 'kittyServer');
    await renderCommits(backendCommits, 'github-commits-backend');
  } catch (err) {
    document.getElementById('github-commits').textContent = 'Error: ' + err.message;
  }
})();