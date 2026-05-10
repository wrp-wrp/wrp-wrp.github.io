(function () {
    const CJK_RE = /[　-〿一-鿿＀-￯]/;

    function tagCjkPosts() {
        const article = document.querySelector('.single-content');
        if (!article) return;
        const firstP = article.querySelector(':scope > p');
        if (!firstP) return;
        const txt = firstP.textContent.trim();
        if (txt && CJK_RE.test(txt[0])) {
            document.body.classList.add('cjk-start');
        }
    }

    function spaceCjkLatin(root) {
        const HAN = '[\\u4e00-\\u9fff]';
        const ALN = '[A-Za-z0-9]';
        const re1 = new RegExp('(' + HAN + ')(' + ALN + ')', 'g');
        const re2 = new RegExp('(' + ALN + ')(' + HAN + ')', 'g');
        const SKIP = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'KBD', 'SAMP', 'TEXTAREA', 'INPUT']);
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode(n) {
                let p = n.parentNode;
                while (p && p !== root) {
                    if (SKIP.has(p.nodeName)) return NodeFilter.FILTER_REJECT;
                    p = p.parentNode;
                }
                return n.nodeValue && (re1.test(n.nodeValue) || re2.test(n.nodeValue))
                    ? NodeFilter.FILTER_ACCEPT
                    : NodeFilter.FILTER_REJECT;
            }
        });
        const targets = [];
        let cur;
        while ((cur = walker.nextNode())) targets.push(cur);
        for (const node of targets) {
            node.nodeValue = node.nodeValue.replace(re1, '$1 $2').replace(re2, '$1 $2');
        }
    }

    function run() {
        tagCjkPosts();
        const article = document.querySelector('.single-content');
        if (article) spaceCjkLatin(article);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
