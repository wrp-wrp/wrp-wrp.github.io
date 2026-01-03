(function () {
    function initTOC() {
        const tocLinks = document.querySelectorAll('.side-toc nav a');
        if (!tocLinks.length) return;

        const sections = [];
        tocLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                const id = href.slice(1);
                // Try to find the element by raw ID or decoded ID
                const element = document.getElementById(id) || document.getElementById(decodeURIComponent(id));
                if (element) {
                    sections.push({ link, element });
                }
            }
        });

        if (!sections.length) return;

        let activeIndex = -1;

        function update() {
            const scrollPos = window.scrollY + 150; // Offset for better detection

            // Find the current active section
            let newIndex = -1;
            for (let i = 0; i < sections.length; i++) {
                if (sections[i].element.offsetTop <= scrollPos) {
                    newIndex = i;
                } else {
                    break;
                }
            }

            if (newIndex !== activeIndex) {
                activeIndex = newIndex;
                tocLinks.forEach(link => link.classList.remove('active'));

                if (activeIndex !== -1) {
                    const activeLink = sections[activeIndex].link;
                    activeLink.classList.add('active');

                    // Smoothly scroll the TOC as well
                    const tocParent = document.querySelector('.side-toc');
                    if (tocParent) {
                        const linkTop = activeLink.offsetTop;
                        const parentHeight = tocParent.clientHeight;
                        if (linkTop > parentHeight - 50 || linkTop < 50) {
                            tocParent.scrollTo({ top: linkTop - 100, behavior: 'smooth' });
                        }
                    }
                }
            }
        }

        window.addEventListener('scroll', update, { passive: true });
        update();

        // Final recalibration after images/math are likely loaded
        setTimeout(update, 2000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTOC);
    } else {
        initTOC();
    }

    // Also re-run on full window load to capture KaTeX shifts
    window.addEventListener('load', initTOC);
})();
