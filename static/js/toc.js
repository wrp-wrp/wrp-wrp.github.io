(function () {
    function initTOC() {
        const toc = document.querySelector('.side-toc');
        if (!toc) return;
        const desktop = window.matchMedia('(min-width: 1140px)');
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const syncLayout = () => { toc.open = desktop.matches; };
        syncLayout();
        desktop.addEventListener('change', syncLayout);
        const tocLinks = toc.querySelectorAll('nav a');
        if (!tocLinks.length) return;

        const sections = [];
        tocLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                let id = href.slice(1);
                try { id = decodeURIComponent(id); } catch (e) {}
                // Try to find the element by raw ID or decoded ID
                const element = document.getElementById(id);
                if (element) {
                    sections.push({ link, element });
                    // Close before the native anchor jump recalculates the
                    // heading position with the mobile directory collapsed.
                    link.addEventListener('click', e => {
                        if (!desktop.matches && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
                            toc.open = false;
                        }
                    });
                }
            }
        });

        if (!sections.length) return;

        let activeIndex = -1;
        let scheduled = false;

        function update() {
            scheduled = false;

            // Find the current active section
            let newIndex = -1;
            for (let i = 0; i < sections.length; i++) {
                if (sections[i].element.getBoundingClientRect().top <= 150) {
                    newIndex = i;
                } else {
                    break;
                }
            }

            if (newIndex !== activeIndex) {
                activeIndex = newIndex;
                tocLinks.forEach(link => {
                    link.classList.remove('active');
                    link.removeAttribute('aria-current');
                });

                if (activeIndex !== -1) {
                    const activeLink = sections[activeIndex].link;
                    activeLink.classList.add('active');
                    activeLink.setAttribute('aria-current', 'location');

                    // Smoothly scroll the TOC as well
                    if (desktop.matches && toc.open) {
                        const bounds = toc.getBoundingClientRect();
                        const linkBounds = activeLink.getBoundingClientRect();
                        if (linkBounds.top < bounds.top || linkBounds.bottom > bounds.bottom) {
                            toc.scrollTo({
                                top: toc.scrollTop + linkBounds.top - bounds.top - 60,
                                behavior: reducedMotion.matches ? 'auto' : 'smooth',
                            });
                        }
                    }
                }
            }
        }

        function scheduleUpdate() {
            if (scheduled) return;
            scheduled = true;
            window.requestAnimationFrame(update);
        }
        window.addEventListener('scroll', scheduleUpdate, { passive: true });
        window.addEventListener('resize', scheduleUpdate);
        window.addEventListener('load', scheduleUpdate, { once: true });
        update();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTOC, { once: true });
    } else {
        initTOC();
    }

})();
