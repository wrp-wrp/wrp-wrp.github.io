/* site-enhance.js — reading progress, theme toggle, pagefind loader, kbd shortcuts */
(function () {
    'use strict';

    // ---------- 1. Reading progress bar (single pages only) ----------
    if (document.body.classList.contains('single-page')) {
        const bar = document.createElement('div');
        bar.className = 'reading-progress';
        document.body.appendChild(bar);
        const update = () => {
            const h = document.documentElement;
            const total = h.scrollHeight - h.clientHeight;
            const pct = total > 0 ? (h.scrollTop / total) * 100 : 0;
            bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
        };
        document.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        update();
    }

    // ---------- 2. Theme toggle ----------
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-toggle-icon');
    const STORAGE_KEY = 'rprp.theme';

    function applyTheme(theme) {
        // theme: 'light' | 'dark'
        document.body.classList.remove('light', 'dark');
        document.body.classList.add(theme);
        if (themeIcon) themeIcon.textContent = theme === 'dark' ? 'ink' : 'paper';
        if (themeToggle) {
            themeToggle.setAttribute(
                'aria-label',
                theme === 'dark' ? 'Switch to paper theme' : 'Switch to ink theme'
            );
        }
        try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
    }

    function currentTheme() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === 'light' || stored === 'dark') return stored;
        } catch (e) {}
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // Initialize on load
    applyTheme(currentTheme());

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const next = currentTheme() === 'dark' ? 'light' : 'dark';
            applyTheme(next);
        });
    }

    // ---------- 3. Pagefind search ----------
    const searchTrigger = document.getElementById('search-trigger');
    const searchModal = document.getElementById('search-modal');
    const searchFallback = document.getElementById('search-fallback');
    let pagefindLoaded = false;

    async function loadPagefind() {
        if (pagefindLoaded) return;
        pagefindLoaded = true;
        try {
            // Inject pagefind UI css
            const css = document.createElement('link');
            css.rel = 'stylesheet';
            css.href = '/pagefind/pagefind-ui.css';
            document.head.appendChild(css);

            // Inject pagefind UI script
            await new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = '/pagefind/pagefind-ui.js';
                s.onload = resolve;
                s.onerror = reject;
                document.head.appendChild(s);
            });

            // Initialize PagefindUI
            new window.PagefindUI({
                element: '#pagefind-search',
                showSubResults: true,
                showImages: false,
                resetStyles: false,
                pageSize: 8,
                translations: {
                    placeholder: 'Search posts…',
                    zero_results: 'No results for "[SEARCH_TERM]"',
                },
            });
        } catch (err) {
            pagefindLoaded = false;
            if (searchFallback) searchFallback.style.display = 'block';
            console.warn('[search] pagefind not available — run: npx pagefind --site public');
        }
    }

    function openSearch() {
        if (!searchModal) return;
        searchModal.classList.add('open');
        searchModal.setAttribute('aria-hidden', 'false');
        loadPagefind().then(() => {
            const input = document.querySelector('#pagefind-search input');
            if (input) input.focus();
        });
    }

    function closeSearch() {
        if (!searchModal) return;
        searchModal.classList.remove('open');
        searchModal.setAttribute('aria-hidden', 'true');
    }

    if (searchTrigger) {
        searchTrigger.addEventListener('click', openSearch);
    }

    if (searchModal) {
        searchModal.addEventListener('click', (e) => {
            if (e.target === searchModal) closeSearch();
        });
    }

    // keyboard shortcut: "/" to open, Esc to close
    document.addEventListener('keydown', (e) => {
        const target = e.target;
        const tag = target && target.tagName;
        const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || (target && target.isContentEditable);

        if (e.key === '/' && !isInput) {
            e.preventDefault();
            openSearch();
        } else if (e.key === 'Escape' && searchModal && searchModal.classList.contains('open')) {
            closeSearch();
        } else if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            openSearch();
        }
    });

    // ---------- 4. External links — open in new tab ----------
    document.querySelectorAll('.single-content a[href^="http"]').forEach((a) => {
        try {
            const u = new URL(a.href);
            if (u.hostname !== location.hostname) {
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
            }
        } catch (e) {}
    });
})();
