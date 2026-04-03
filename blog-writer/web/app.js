// === State ===
var posts = [];
var currentSlug = null;
var currentRaw = '';
var saveTimer = null;
var ws = null;
var HUGO_PORT = 1313;

// === DOM refs ===
function $(sel) { return document.querySelector(sel); }
var postListEl = $('#post-list');
var editorEl = $('#editor');
var editorEmpty = $('#editor-empty');
var editorContainer = $('#editor-container');
var previewFrame = $('#preview-frame');
var statusSave = $('#status-save');
var statusWords = $('#status-words');
var statusTime = $('#status-time');
var hugoStatus = $('#hugo-status');
var searchInput = $('#search-input');
var fmTitle = $('#fm-title');
var fmDate = $('#fm-date');
var fmDraft = $('#fm-draft');
var fmMath = $('#fm-math');

// === API helpers ===
function api(path, opts) {
    opts = opts || {};
    return fetch(path, {
        headers: { 'Content-Type': 'application/json' },
        method: opts.method || 'GET',
        body: opts.body || null,
    }).then(function(res) { return res.json(); });
}

// === Posts list ===
function loadPosts() {
    return api('/api/posts').then(function(data) {
        posts = data;
        renderPosts(posts);
    });
}

function renderPosts(list) {
    var q = searchInput.value.toLowerCase();
    var filtered = q
        ? list.filter(function(p) {
              return (p.title || '').toLowerCase().indexOf(q) >= 0 ||
                     p.slug.toLowerCase().indexOf(q) >= 0;
          })
        : list;

    postListEl.innerHTML = filtered
        .map(function(p) {
            var dateStr = formatDate(p.date);
            return '<div class="post-item' + (p.slug === currentSlug ? ' active' : '') + '" data-slug="' + p.slug + '">' +
                '<div class="post-item-title">' + escapeHtml(p.title || p.slug) + '</div>' +
                '<div class="post-item-meta">' +
                    '<span>' + dateStr + '</span>' +
                    (p.draft ? '<span class="post-item-draft">DRAFT</span>' : '') +
                '</div>' +
            '</div>';
        })
        .join('');

    postListEl.querySelectorAll('.post-item').forEach(function(el) {
        el.addEventListener('click', function() { openPost(el.dataset.slug); });
    });
}

// === Open post ===
function openPost(slug) {
    var savePromise = currentSlug ? saveCurrent() : Promise.resolve();

    savePromise.then(function() {
        currentSlug = slug;
        return api('/api/posts/' + slug);
    }).then(function(post) {
        currentRaw = post.raw;

        editorEmpty.style.display = 'none';
        editorContainer.style.display = 'flex';
        $('#btn-delete').style.display = '';

        var fm = post.frontmatter || {};
        fmTitle.value = fm.title || '';
        fmDate.value = fm.date || '';
        fmDraft.checked = !!fm.draft;
        fmMath.checked = fm.math !== false;

        editorEl.value = post.body;
        editorEl.focus();

        refreshPreview(slug);
        renderPosts(posts);
        updateWordCount(post.body);
        updateStatus('Loaded');
    });
}

// === Editor events ===
editorEl.addEventListener('input', function() {
    currentRaw = rebuildRaw(editorEl.value);
    scheduleSave();
    updateWordCount(editorEl.value);
});

// Tab key
editorEl.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
        e.preventDefault();
        var start = this.selectionStart;
        var end = this.selectionEnd;
        this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 4;
        this.dispatchEvent(new Event('input'));
    }
});

// Ctrl+S / Cmd+S
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentSlug && currentRaw) {
            clearTimeout(saveTimer);
            saveCurrent();
        }
    }
});

// === Paste / Drop image support ===
function insertAtCursor(text) {
    var start = editorEl.selectionStart;
    var end = editorEl.selectionEnd;
    var before = editorEl.value.substring(0, start);
    var after = editorEl.value.substring(end);
    editorEl.value = before + text + after;
    editorEl.selectionStart = editorEl.selectionEnd = start + text.length;
    editorEl.dispatchEvent(new Event('input'));
    editorEl.focus();
}

function uploadImage(file) {
    if (!currentSlug) return Promise.resolve(null);
    var formData = new FormData();
    formData.append('file', file);

    return fetch('/api/posts/' + currentSlug + '/media', {
        method: 'POST',
        body: formData,
    }).then(function(res) { return res.json(); })
    .then(function(result) {
        return result.filename || null;
    });
}

// Paste handler — support multiple images
editorEl.addEventListener('paste', function(e) {
    var items = (e.clipboardData || {}).items || [];
    var imageFiles = [];
    for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') === 0) {
            var file = items[i].getAsFile();
            if (file) imageFiles.push(file);
        }
    }
    if (imageFiles.length === 0) return;
    e.preventDefault();

    statusSave.textContent = 'Uploading ' + imageFiles.length + ' image(s)...';
    statusSave.style.color = 'var(--yellow)';

    Promise.all(imageFiles.map(uploadImage)).then(function(filenames) {
        var valid = filenames.filter(Boolean);
        var md = valid.map(function(f) { return '![](' + f + ')'; }).join('\n');
        insertAtCursor(md);
        statusSave.textContent = valid.length + ' image(s) uploaded';
        statusSave.style.color = 'var(--green)';
    }).catch(function() {
        statusSave.textContent = 'Upload failed';
        statusSave.style.color = 'var(--red)';
    });
});

// Drag & drop handler — support multiple files
editorEl.addEventListener('dragover', function(e) {
    e.preventDefault();
    editorEl.style.outline = '2px dashed var(--accent)';
    editorEl.style.outlineOffset = '-4px';
});

editorEl.addEventListener('dragleave', function() {
    editorEl.style.outline = '';
    editorEl.style.outlineOffset = '';
});

editorEl.addEventListener('drop', function(e) {
    e.preventDefault();
    editorEl.style.outline = '';
    editorEl.style.outlineOffset = '';
    var files = (e.dataTransfer || {}).files || [];
    var imageFiles = [];
    for (var i = 0; i < files.length; i++) {
        if (files[i].type.indexOf('image') === 0) {
            imageFiles.push(files[i]);
        }
    }
    if (imageFiles.length === 0) return;

    statusSave.textContent = 'Uploading ' + imageFiles.length + ' image(s)...';
    statusSave.style.color = 'var(--yellow)';

    Promise.all(imageFiles.map(uploadImage)).then(function(filenames) {
        var valid = filenames.filter(Boolean);
        var md = valid.map(function(f) { return '![](' + f + ')'; }).join('\n');
        insertAtCursor(md);
        statusSave.textContent = valid.length + ' image(s) uploaded';
        statusSave.style.color = 'var(--green)';
    }).catch(function() {
        statusSave.textContent = 'Upload failed';
        statusSave.style.color = 'var(--red)';
    });
});

// === Save ===
function scheduleSave() {
    clearTimeout(saveTimer);
    statusSave.textContent = 'Saving...';
    statusSave.style.color = 'var(--yellow)';
    saveTimer = setTimeout(saveCurrent, 500);
}

function saveCurrent() {
    if (!currentSlug || !currentRaw) return Promise.resolve();
    return api('/api/posts/' + currentSlug, {
        method: 'PUT',
        body: JSON.stringify({ raw: currentRaw }),
    }).then(function() {
        statusSave.textContent = 'Saved';
        statusSave.style.color = 'var(--green)';
        statusTime.textContent = new Date().toLocaleTimeString();
        refreshPreview(currentSlug);
    }).catch(function() {
        statusSave.textContent = 'Save failed';
        statusSave.style.color = 'var(--red)';
    });
}

function rebuildRaw(body) {
    var title = fmTitle.value;
    var date = fmDate.value;
    var draft = fmDraft.checked;
    var math = fmMath.checked;

    var raw = '+++\n';
    if (date) raw += "date = '" + date + "'\n";
    raw += 'draft = ' + draft + '\n';
    raw += 'math = ' + math + '\n';
    if (title) raw += "title = '" + title + "'\n";
    raw += '+++\n\n';
    raw += body;
    return raw;
}

// === Frontmatter change handlers ===
[fmTitle, fmDate, fmDraft, fmMath].forEach(function(el) {
    el.addEventListener('change', function() {
        if (!currentSlug) return;
        currentRaw = rebuildRaw(editorEl.value);
        scheduleSave();
    });
});

// === Preview ===
function refreshPreview(slug) {
    var url = 'http://127.0.0.1:' + HUGO_PORT + '/posts/' + slug + '/?t=' + Date.now();
    previewFrame.src = url;
}

$('#btn-refresh-preview').addEventListener('click', function() {
    if (currentSlug) refreshPreview(currentSlug);
});

// === New post ===
$('#btn-new').addEventListener('click', function() {
    showModal('New Post',
        '<label for="new-slug">Slug (URL name):</label>' +
        '<input type="text" id="new-slug" placeholder="my-new-post">',
        function() {
            var slug = $('#new-slug').value.trim();
            if (!slug) return Promise.resolve();
            return api('/api/posts', {
                method: 'POST',
                body: JSON.stringify({ slug: slug }),
            }).then(function(result) {
                if (result.error) {
                    alert(result.error);
                    return;
                }
                hideModal();
                return loadPosts().then(function() { openPost(slug); });
            });
        }
    );
});

// === Delete post ===
$('#btn-delete').addEventListener('click', function() {
    if (!currentSlug) return;
    showModal('Delete Post',
        '<p>Are you sure you want to delete <strong>' + escapeHtml(currentSlug) + '</strong>?</p>' +
        '<p style="color:var(--red);font-size:13px;margin-top:8px">This cannot be undone.</p>',
        function() {
            return api('/api/posts/' + currentSlug, { method: 'DELETE' }).then(function() {
                currentSlug = null;
                currentRaw = '';
                editorEmpty.style.display = '';
                editorContainer.style.display = 'none';
                $('#btn-delete').style.display = 'none';
                previewFrame.src = 'about:blank';
                editorEl.value = '';
                hideModal();
                return loadPosts().then(function() { updateStatus('Deleted'); });
            });
        }
    );
});

// === Publish ===
$('#btn-publish').addEventListener('click', function() {
    $('#publish-overlay').style.display = 'flex';
    $('#diff-preview').textContent = 'Loading diff...';
    $('#commit-message').value = '';

    api('/api/publish/diff').then(function(data) {
        $('#diff-preview').textContent = data.diff || 'No changes.';
    }).catch(function() {
        $('#diff-preview').textContent = 'Failed to load diff.';
    });
});

$('#publish-cancel').addEventListener('click', function() {
    $('#publish-overlay').style.display = 'none';
});

$('#publish-confirm').addEventListener('click', function() {
    var message = $('#commit-message').value.trim() || 'blog: update posts';
    $('#publish-confirm').disabled = true;
    $('#publish-confirm').textContent = 'Publishing...';

    api('/api/publish', {
        method: 'POST',
        body: JSON.stringify({ message: message }),
    }).then(function(result) {
        if (result.status === 'published') {
            updateStatus('Published!');
            $('#publish-overlay').style.display = 'none';
        } else {
            $('#diff-preview').textContent = result.output + '\n\nError: ' + (result.error || 'unknown');
            updateStatus('Publish failed');
        }
    }).catch(function(e) {
        $('#diff-preview').textContent = 'Network error: ' + e.message;
    }).then(function() {
        $('#publish-confirm').disabled = false;
        $('#publish-confirm').textContent = 'Publish';
    });
});

// === Modal helpers ===
function showModal(title, bodyHTML, onConfirm) {
    $('#modal-title').textContent = title;
    $('#modal-body').innerHTML = bodyHTML;
    $('#modal-overlay').style.display = 'flex';

    var confirmBtn = $('#modal-confirm');
    var cancelBtn = $('#modal-cancel');

    function handleConfirm() {
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        Promise.resolve(onConfirm()).catch(function(e) { console.error(e); });
    }

    function handleCancel() {
        hideModal();
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
    }

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);

    var firstInput = $('#modal-body').querySelector('input');
    if (firstInput) {
        setTimeout(function() { firstInput.focus(); }, 50);
        firstInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') handleConfirm();
        });
    }
}

function hideModal() {
    $('#modal-overlay').style.display = 'none';
}

// === Search ===
searchInput.addEventListener('input', function() { renderPosts(posts); });

// === WebSocket ===
function connectWS() {
    var proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(proto + '//' + location.host + '/api/live');

    ws.onopen = function() {
        hugoStatus.textContent = 'connected';
        hugoStatus.classList.add('connected');
        hugoStatus.classList.remove('error');
    };

    ws.onmessage = function(e) {
        try {
            var msg = JSON.parse(e.data);
            if (msg.type === 'hugo' && msg.event === 'rebuilt') {
                if (currentSlug) refreshPreview(currentSlug);
            }
            if (msg.type === 'file') {
                loadPosts();
            }
        } catch (err) {}
    };

    ws.onclose = function() {
        hugoStatus.textContent = 'disconnected';
        hugoStatus.classList.remove('connected');
        hugoStatus.classList.add('error');
        setTimeout(connectWS, 3000);
    };

    ws.onerror = function() {
        hugoStatus.textContent = 'error';
        hugoStatus.classList.add('error');
    };
}

// === Utilities ===
function updateStatus(msg) {
    statusSave.textContent = msg;
    statusSave.style.color =
        (msg.indexOf('fail') >= 0 || msg.indexOf('error') >= 0)
            ? 'var(--red)'
            : 'var(--green)';
}

function updateWordCount(text) {
    var words = text.trim().split(/\s+/).filter(Boolean).length;
    statusWords.textContent = words + ' words';
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        var d = new Date(dateStr);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    } catch (e) {
        return dateStr;
    }
}

function escapeHtml(s) {
    var el = document.createElement('span');
    el.textContent = s;
    return el.innerHTML;
}

// === Theme toggle ===
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('blog-writer-theme', theme);
    var sun = $('#icon-sun');
    var moon = $('#icon-moon');
    if (theme === 'light') {
        sun.style.display = 'none';
        moon.style.display = '';
    } else {
        sun.style.display = '';
        moon.style.display = 'none';
    }
}

// restore saved theme
var savedTheme = localStorage.getItem('blog-writer-theme') || 'dark';
setTheme(savedTheme);

$('#btn-theme').addEventListener('click', function() {
    var current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
});

// === Init ===
loadPosts();
connectWS();
setInterval(function() {
    statusTime.textContent = new Date().toLocaleTimeString();
}, 1000);
