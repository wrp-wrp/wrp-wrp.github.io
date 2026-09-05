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
    const searchClose = document.getElementById('search-close');
    const searchRetry = document.getElementById('search-retry');
    const searchStatus = document.getElementById('search-status');
    const searchFallback = document.getElementById('search-fallback');
    let pagefindUI = null;
    let pagefindLoading = null;
    let searchReturnFocus = null;

    function loadPagefind() {
        if (pagefindUI) return Promise.resolve();
        if (pagefindLoading) return pagefindLoading;

        pagefindLoading = (async () => {
            const base = searchModal.dataset.pagefindBase;
            if (!document.getElementById('pagefind-ui-styles')) {
                const css = document.createElement('link');
                css.id = 'pagefind-ui-styles';
                css.rel = 'stylesheet';
                css.href = base + 'pagefind-ui.css';
                document.head.appendChild(css);
            }

            if (!window.PagefindUI) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = base + 'pagefind-ui.js';
                    script.onload = resolve;
                    script.onerror = () => {
                        script.remove();
                        reject(new Error('Search could not be loaded'));
                    };
                    document.head.appendChild(script);
                });
            }

            pagefindUI = new window.PagefindUI({
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
        })().finally(() => { pagefindLoading = null; });
        return pagefindLoading;
    }

    async function openSearch() {
        if (!searchModal) return;
        if (!searchModal.open) {
            searchReturnFocus = document.activeElement === document.body
                ? searchTrigger : document.activeElement;
            searchModal.showModal();
            document.documentElement.classList.add('search-open');
        }
        searchFallback.hidden = true;
        searchStatus.hidden = !!pagefindUI;
        try {
            await loadPagefind();
            if (searchModal.open) {
                const input = searchModal.querySelector('input');
                if (input) input.focus();
            }
        } catch (err) {
            searchFallback.hidden = false;
            console.warn('[search]', err);
        } finally {
            searchStatus.hidden = true;
        }
    }

    function closeSearch() {
        if (!searchModal || !searchModal.open) return;
        searchModal.close();
        finishSearchClose();
    }

    function finishSearchClose() {
        // A queued close event must not affect a dialog that was reopened.
        if (searchModal.open) return;
        document.documentElement.classList.remove('search-open');
        const target = searchReturnFocus && searchReturnFocus.isConnected
            ? searchReturnFocus : searchTrigger;
        if (target) target.focus({ preventScroll: true });
    }

    if (searchTrigger) {
        searchTrigger.addEventListener('click', openSearch);
    }

    if (searchModal) {
        searchClose.addEventListener('click', closeSearch);
        searchRetry.addEventListener('click', openSearch);
        searchModal.addEventListener('keydown', e => {
            if (e.key !== 'Tab') return;
            const controls = Array.from(searchModal.querySelectorAll(
                'a[href], button, input, select, textarea, [tabindex]'
            )).filter(el => el.tabIndex >= 0 && !el.disabled && el.getClientRects().length > 0);
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        });
        searchModal.addEventListener('cancel', e => {
            e.preventDefault();
            closeSearch();
        });
        searchModal.addEventListener('close', finishSearchClose);
        searchModal.addEventListener('click', (e) => {
            if (e.target === searchModal) closeSearch();
        });
    }

    // keyboard shortcut: "/" to open, Esc to close
    document.addEventListener('keydown', (e) => {
        if (e.defaultPrevented || e.isComposing) return;
        const target = e.target;
        const tag = target && target.tagName;
        const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || (target && target.isContentEditable);

        if (e.key === '/' && !isInput) {
            e.preventDefault();
            openSearch();
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
