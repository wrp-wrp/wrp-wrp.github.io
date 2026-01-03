document.addEventListener('DOMContentLoaded', () => {
    const tocLinks = document.querySelectorAll('.side-toc nav a');
    const sections = [];

    // 1. Precise Section Mapping
    tocLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href || !href.startsWith('#')) return;

        const id = href.substring(1);
        const element = document.getElementById(id) || document.getElementById(decodeURIComponent(id));
        if (element) {
            sections.push({ link, id, element });
        }
    });

    if (sections.length === 0) return;

    function updateActiveHeader() {
        const scrollPosition = window.scrollY + 120; // Slight buffer for readability

        // Current active candidate
        let activeInstance = sections[0];

        for (const section of sections) {
            if (section.element.offsetTop <= scrollPosition) {
                activeInstance = section;
            } else {
                break;
            }
        }

        // Apply classes
        sections.forEach(s => {
            if (s === activeInstance) {
                if (!s.link.classList.contains('active')) {
                    s.link.classList.add('active');
                    // Ensure TOC scrolls to keep active link visible
                    s.link.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            } else {
                s.link.classList.remove('active');
            }
        });
    }

    // Optimization: Throttled scroll listener
    let isScrolling = false;
    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                updateActiveHeader();
                isScrolling = false;
            });
            isScrolling = true;
        }
    }, { passive: true });

    // Initial trigger
    updateActiveHeader();
});
