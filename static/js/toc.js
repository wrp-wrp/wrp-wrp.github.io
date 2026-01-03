document.addEventListener('DOMContentLoaded', () => {
    const tocLinks = document.querySelectorAll('.side-toc nav a');
    if (tocLinks.length === 0) return;

    const sections = Array.from(tocLinks).map(link => {
        const id = decodeURIComponent(link.getAttribute('href').substring(1));
        return document.getElementById(id);
    }).filter(s => s !== null);

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                tocLinks.forEach(link => {
                    const href = decodeURIComponent(link.getAttribute('href').substring(1));
                    link.classList.toggle('active', href === id);
                });
            }
        });
    }, {
        rootMargin: '0px 0px -80% 0px',
        threshold: 0
    });

    sections.forEach(s => observer.observe(s));
});
