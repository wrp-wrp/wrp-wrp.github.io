(() => {
  const input = document.querySelector('#post-search');
  if (input) {
    const rows = [...document.querySelectorAll('.journal-entry')];
    const filters = [...document.querySelectorAll('[data-filter]')];
    let filter = 'all';
    function update() {
      const query = input.value.trim().toLocaleLowerCase();
      let count = 0;
      rows.forEach(row => { row.hidden = !((filter === 'all' || row.dataset.category === filter) && (!query || row.dataset.search.includes(query))); if (!row.hidden) count++; });
      document.querySelector('#search-empty').hidden = count > 0;
      const status = document.querySelector('#search-count'); status.hidden = !query && filter === 'all'; status.textContent = '找到 ' + count + ' 篇文章';
    }
    input.addEventListener('input', update);
    filters.forEach(button => button.addEventListener('click', () => { filter = button.dataset.filter; filters.forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); }); update(); }));
    document.querySelector('#clear-search').addEventListener('click', () => { input.value = ''; filters[0].click(); input.focus(); });
    document.addEventListener('keydown', e => { if(e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); input.focus(); } });
  }
  document.querySelectorAll('.prose pre').forEach(pre => { if (pre.classList.contains('mermaid')) return; const button = document.createElement('button'); button.className = 'copy-code'; button.textContent = '复制'; button.setAttribute('aria-label', '复制代码'); button.addEventListener('click', async () => { try { await navigator.clipboard.writeText(pre.querySelector('code')?.textContent || pre.textContent.replace(/复制$/, '')); button.textContent = '已复制'; } catch { button.textContent = '请手动复制'; } setTimeout(() => button.textContent = '复制', 1800); }); pre.append(button); });
  const sectionLinks = [...document.querySelectorAll('.section-nav a[href^="#"]')];
  if (sectionLinks.length && 'IntersectionObserver' in window) { const observer = new IntersectionObserver(entries => entries.forEach(entry => { if(entry.isIntersecting) sectionLinks.forEach(a => a.classList.toggle('active', a.hash === '#' + entry.target.id)); }), {rootMargin:'-15% 0px -65% 0px'}); document.querySelectorAll('.academic-section').forEach(section => observer.observe(section)); }
})();
