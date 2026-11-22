(() => {
  const filters = document.querySelector('.post-filters');
  if (filters) {
    const search = document.querySelector('#post-search');
    const tag = document.querySelector('#post-tag');
    const rows = Array.from(document.querySelectorAll('#post-list .post-row'), row => ({
      row,
      tags: JSON.parse(row.dataset.tags),
      text: row.querySelector('.post-row-copy').textContent.toLocaleLowerCase()
    }));
    const empty = document.querySelector('#search-empty');

    function filterPosts() {
      const query = search.value.trim().toLocaleLowerCase();
      let matches = 0;
      for (const entry of rows) {
        const matchesTag = !tag?.value || entry.tags.some(value =>
          value.toLocaleLowerCase() === tag.value.toLocaleLowerCase()
        );
        entry.row.hidden = !matchesTag || !entry.text.includes(query);
        if (!entry.row.hidden) matches += 1;
      }
      empty.hidden = matches > 0;
    }

    filters.hidden = false;
    search.addEventListener('input', filterPosts);
    tag?.addEventListener('change', filterPosts);
    document.addEventListener('keydown', event => {
      if (event.key === '/' && !event.ctrlKey && !event.metaKey &&
          !document.activeElement.closest('input, textarea, select, [contenteditable]')) {
        event.preventDefault();
        search.focus();
      }
    });
  }

  document.querySelectorAll('.prose pre > code').forEach(code => {
    if (code.parentElement.classList.contains('mermaid')) return;
    const pre = code.parentElement;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-code';
    button.textContent = '复制';
    button.setAttribute('aria-label', '复制代码');
    let resetTimer;
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.textContent);
        button.textContent = '已复制';
      } catch {
        button.textContent = '请手动复制';
      }
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => { button.textContent = '复制'; }, 1800);
    });
    pre.append(button);
  });
})();
