(() => {
'use strict';
const C=StudioCore,$=id=>document.getElementById(id),PREFIX='rprp-studio-v1:';
const converter=new showdown.Converter({tables:true,tasklists:true,strikethrough:true,simplifiedAutoLink:true,literalMidWordUnderscores:true});
let docs=[],active=null,saveTimer,previewTimer,toastTimer,token='',branch='master',unsaved=false,revision=null,connectionAction=null;
function toast(message){$('studio-toast').textContent=message;$('studio-toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('studio-toast').hidden=true,4500);}
function failure(e){return e.name==='TimeoutError'?'请求超时，草稿仍在本地，请稍后重试。':e.message==='Failed to fetch'?'网络连接失败，草稿仍在本地。':e.message;}
function readAll(){
const list=[];
for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(!key.startsWith(PREFIX))continue;try{const d=JSON.parse(localStorage.getItem(key));if(typeof d.id==='string'&&typeof d.title==='string'&&typeof d.body==='string'&&Array.isArray(d.tags))list.push(d);}catch{toast('有一份本地草稿无法读取，原始数据已保留。');}}
return list.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
}
function list(){
$('draft-count').textContent=docs.length;$('draft-list').replaceChildren();
for(const d of docs){const b=document.createElement('button');b.className='draft-item'+(d.id===active?.id?' selected':'');b.setAttribute('aria-current',d.id===active?.id?'true':'false');const title=document.createElement('strong');title.textContent=d.title||'未命名文章';const meta=document.createElement('small');meta.textContent=(d.date||C.today()).slice(0,10)+' · '+(d.gitSha?'已同步':'本地草稿');b.append(title,meta);b.onclick=()=>{if(persist()){select(d.id);}};$('draft-list').append(b);}
}
function persist(){
clearTimeout(saveTimer);if(!active||!unsaved)return true;
try{
const raw=localStorage.getItem(PREFIX+active.id);
if(raw&&raw!==revision){const copy={...active,id:crypto.randomUUID(),gitSha:null,slug:active.slug+'-copy',title:active.title+'（本地副本）'};docs.unshift(copy);active=copy;toast('另一标签页修改了原稿，已将这次编辑保存为副本。');}
active.updatedAt=new Date().toISOString();const text=JSON.stringify(active);localStorage.setItem(PREFIX+active.id,text);revision=text;unsaved=false;$('save-status').textContent='已保存到此浏览器 · '+new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});$('save-status').classList.remove('save-error');list();return true;
}catch{$('save-status').textContent='本地保存失败，请导出备份';$('save-status').classList.add('save-error');return false;}
}
function preview(){
if (!active) return;
const body=active.body;
$('article-preview').innerHTML=DOMPurify.sanitize(converter.makeHtml(body),{FORBID_TAGS:['style','iframe','object','embed','form','input','button','textarea','select'],FORBID_ATTR:['style']});
$('article-preview').querySelectorAll('a').forEach(a=>{a.target='_blank';a.rel='noopener noreferrer';});
if(window.renderMathInElement){try{renderMathInElement($('article-preview'),{delimiters:[{left:'$$',right:'$$',display:true},{left:'\\[',right:'\\]',display:true},{left:'$',right:'$',display:false},{left:'\\(',right:'\\)',display:false}],throwOnError:false,trust:false});}catch{}}
if(!body.trim()){const p=document.createElement('p');p.className='muted';p.textContent='正文为空。';$('article-preview').append(p);}
const chars=(body.match(/[\u3400-\u9fff]/g)||[]).length+(body.replace(/[\u3400-\u9fff]/g,' ').match(/\b[\w'-]+\b/g)||[]).length;
$('word-count').textContent=chars+' 字 / 词 · 约 '+Math.max(1,Math.ceil(chars/300))+' 分钟阅读';
}
function changed(){
unsaved=true;$('save-status').textContent='正在保存…';clearTimeout(saveTimer);saveTimer=setTimeout(persist,450);clearTimeout(previewTimer);previewTimer=setTimeout(preview,180);
}
function select(id){
active=docs.find(d=>d.id===id);revision=localStorage.getItem(PREFIX+id);unsaved=false;
$('article-title').value=active.title;$('article-summary').value=active.summary||'';$('article-body').value=active.body;$('article-date').value=active.date.slice(0,10);$('article-tags').value='';renderTags();$('article-slug').value=active.slug;$('article-slug').readOnly=Boolean(active.gitSha);$('article-language').value=active.language||'zh-CN';$('article-hidden').checked=!!active.hidden;
$('save-status').textContent=revision?'已保存到此浏览器':'尚未保存';list();preview();
}
const mapping={'article-title':'title','article-summary':'summary','article-body':'body','article-slug':'slug','article-language':'language'};
Object.entries(mapping).forEach(([id,field])=>$(id).addEventListener('input',()=>{active[field]=$(id).value;changed();}));
$('article-date').addEventListener('change', event => {
  active.date = event.target.value ? event.target.value + active.date.slice(10) : '';
  changed();
});

function renderTags() {
  const selected = $('selected-tags');
  selected.replaceChildren();
  for (const tag of active.tags) {
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = tag + ' ×';
    remove.setAttribute('aria-label', '移除标签 ' + tag);
    remove.onclick = () => {
      active.tags = active.tags.filter(value => value !== tag);
      renderTags();
      changed();
      $('article-tags').focus();
    };
    selected.append(remove);
  }
}

function addTags() {
  const input = $('article-tags');
  const incoming = input.value.split(/[,，\n]/).map(tag => tag.trim()).filter(Boolean);
  if (!incoming.length) return;
  const seen = new Set(active.tags.map(tag => tag.toLocaleLowerCase()));
  for (const tag of incoming) {
    const key = tag.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    active.tags.push(tag);
  }
  input.value = '';
  renderTags();
  changed();
}

$('article-tags').addEventListener('keydown', event => {
  if (event.isComposing || event.key !== 'Enter') return;
  event.preventDefault();
  addTags();
});
$('article-tags').addEventListener('blur', addTags);
$('add-tag').onclick = () => {
  addTags();
  $('article-tags').focus();
};
$('article-hidden').addEventListener('change',()=>{active.hidden=$('article-hidden').checked;changed();});
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{document.querySelector('.editor-body').dataset.mode=b.dataset.view;document.querySelectorAll('[data-view]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});preview();});
document.querySelectorAll('[data-format]').forEach(b=>b.onclick=()=>{
const t=$('article-body'),selected=t.value.slice(t.selectionStart,t.selectionEnd),fence=String.fromCharCode(96).repeat(3);
const snippets={heading:'\n## '+(selected||'小标题')+'\n',bold:'**'+(selected||'重点')+'**',quote:'\n> '+(selected||'引用内容')+'\n',code:'\n'+fence+'cpp\n'+(selected||'// 代码')+'\n'+fence+'\n',link:'['+(selected||'链接文字')+'](https://example.com)',image:'!['+(selected||'图片描述')+'](https://example.com/image.jpg)'};
t.setRangeText(snippets[b.dataset.format],t.selectionStart,t.selectionEnd,'end');t.focus();t.dispatchEvent(new Event('input'));
});
$('new-draft').onclick = () => {
  if (!persist()) return;
  const draft = C.newDraft();
  docs.unshift(draft);
  select(draft.id);
  unsaved = true;
  persist();
  $('article-title').focus();
};
function download(name,text,type='text/plain'){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('export-md').onclick=()=>{try{persist();download(active.slug.replaceAll('/','-')+'.md',C.serialize(active,true),'text/markdown');toast('已导出 Markdown，文件默认为草稿。');}catch(e){toast(failure(e));}};
$('backup-drafts').onclick=()=>{persist();download('rprp-drafts-'+C.today()+'.json',JSON.stringify({version:1,drafts:docs},null,2),'application/json');toast('已导出所有草稿。');};
$('import-md').onclick=()=>$('md-file').click();
$('md-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>2000000)throw new Error('请导入小于 2 MB 的 Markdown 文件。');if(!persist())return;const d=C.parse(await file.text(),file.name);docs.unshift(d);select(d.id);unsaved=true;persist();toast('已导入为新草稿。相对图片路径请随文章一同上传。');}catch(e){toast(failure(e));}finally{e.target.value='';}};
$('restore-drafts').onclick=()=>$('backup-file').click();
$('backup-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>20000000)throw new Error('备份文件超过 20 MB。');if(!persist())return;const imported=C.safeBackup(await file.text());for(const d of imported)localStorage.setItem(PREFIX+d.id,JSON.stringify(d));docs=readAll();if(imported.length)select(imported[0].id);toast('已恢复 '+imported.length+' 份草稿，现有草稿保持不变。');}catch(e){toast(failure(e));}finally{e.target.value='';}};
$('delete-draft').onclick=()=>$('delete-dialog').showModal();
$('delete-cancel').onclick=()=>$('delete-dialog').close();
$('delete-confirm').onclick=()=>{clearTimeout(saveTimer);try{localStorage.removeItem(PREFIX+active.id);docs=docs.filter(d=>d.id!==active.id);unsaved=false;if(!docs.length)docs=[C.newDraft()];select(docs[0].id);$('delete-dialog').close();toast('本地草稿已删除。');}catch{toast('删除失败，草稿仍保留。');}};
function connectThen(action = null) {
  connectionAction = action;
  $('github-dialog').showModal();
}
$('github-open').onclick = () => connectThen();
$('github-form').onsubmit=async e=>{
e.preventDefault();const button=e.target.querySelector('[type=submit]');button.disabled=true;$('github-status').textContent='正在验证…';
try{const candidate=$('github-token').value.trim(),target=$('github-branch').value.trim();if(!/^[A-Za-z0-9_/-]+$/.test(target))throw new Error('分支名格式不正确。');const info=await C.github(candidate,'');if(!info.permissions?.push)throw new Error('此账户没有该仓库的写入权限。');await C.github(candidate,'branches/'+encodeURIComponent(target));token=candidate;branch=target;$('github-token').value='';$('github-open').textContent='GitHub 已连接 ✓';$('github-status').textContent='已连接 '+C.repo+' · '+branch+'。刷新页面后需要重新连接。';$('disconnect-github').hidden=false;const action=connectionAction;connectionAction=null;if(action){$('github-dialog').close();await action();}
}catch(e){$('github-status').textContent=failure(e);}finally{button.disabled=false;}
};
$('disconnect-github').onclick=()=>{token='';$('github-token').value='';$('github-open').textContent='连接 GitHub ↗';$('github-status').textContent='已断开连接。';$('disconnect-github').hidden=true;};
async function browseExisting() {
  if (!token) return connectThen(browseExisting);
  if (!persist()) return;
  const dialog = $('existing-dialog');
  const options = $('existing-post');
  const load = $('existing-load');
  const status = $('existing-status');
  options.replaceChildren();
  $('existing-fresh').checked = false;
  load.disabled = true;
  status.textContent = '正在读取文章列表…';
  dialog.showModal();
  try {
    const result = await C.github(token, 'git/trees/' + encodeURIComponent(branch) + '?recursive=1');
    if (result.truncated) throw new Error('仓库未返回完整文章列表，请导入 Markdown 文件。');
    const paths = result.tree.filter(item => item.type === 'blob' && /^content\/posts\/.+\/index\.md$/.test(item.path));
    const titles = new Map(Array.from($('published-titles').content.querySelectorAll('span'),
      element => [element.dataset.slug, element.textContent]));
    for (const { path } of paths) {
      const slug = path.slice('content/posts/'.length, -'/index.md'.length);
      options.add(new Option(titles.get(slug) || slug, slug));
    }
    status.textContent = paths.length ? '' : '这个分支没有文章。';
    load.disabled = !paths.length;
  } catch (error) {
    status.textContent = failure(error);
  }
}

$('existing-open').onclick = browseExisting;
$('existing-form').onsubmit = async event => {
  event.preventDefault();
  const button = $('existing-load');
  const status = $('existing-status');
  const slug = $('existing-post').value;
  if (!slug || button.disabled) return;
  const localDraft = docs.find(draft => draft.gitPath === slug && draft.gitBranch === branch);
  if (localDraft && !$('existing-fresh').checked) {
    select(localDraft.id);
    $('existing-dialog').close();
    toast('已打开这篇文章的本地编辑。');
    return;
  }
  button.disabled = true;
  status.textContent = '正在读取文章…';
  try {
    const remote = await C.github(token, C.contentPath({ slug }) + '?ref=' + encodeURIComponent(branch));
    const draft = C.parse(C.fromBase64(remote.content), slug.split('/').pop() + '.md');
    Object.assign(draft, { slug, gitSha: remote.sha, gitBranch: branch, gitPath: slug });
    docs.unshift(draft);
    select(draft.id);
    unsaved = true;
    persist();
    $('existing-dialog').close();
    $('article-title').focus();
  } catch (error) {
    status.textContent = failure(error);
  } finally {
    button.disabled = false;
  }
};

function openPublish() {
  if (!persist()) return;
  try {
    C.validate(active);
  } catch (error) {
    toast(failure(error));
    return;
  }
  if (!token) return connectThen(openPublish);
  $('publish-target').textContent = branch + ' · content/posts/' + active.slug + '/index.md';
  $('publish-status').textContent = '';
  $('commit-link').hidden = true;
  $('publish-live').checked = active.wasDraft === false;
  $('publish-confirm').disabled = false;
  $('publish-dialog').showModal();
}

$('publish-open').onclick = openPublish;
$('publish-dialog').addEventListener('cancel', event => {
  if ($('publish-confirm').disabled && $('commit-link').hidden) event.preventDefault();
});
$('publish-confirm').onclick = async () => {
  const button = $('publish-confirm');
  const status = $('publish-status');
  const draft = active;
  const isPublic = $('publish-live').checked;
  button.disabled = true;
  status.textContent = '正在检查版本并提交…';
  try {
    const result = await C.publish(token, branch, draft, isPublic);
    Object.assign(draft, { gitSha: result.content.sha, gitBranch: branch, gitPath: draft.slug, wasDraft: !isPublic });
    unsaved = true;
    persist();
    $('article-slug').readOnly = true;
    status.textContent = isPublic ? '已提交到 GitHub，网站更新取决于部署状态。' : '已提交为仓库草稿。';
    $('commit-link').href = result.commit.html_url;
    $('commit-link').hidden = false;
  } catch (error) {
    status.textContent = failure(error);
    button.disabled = false;
  }
};
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();persist();}});
window.addEventListener('beforeunload',e=>{if(!persist()){e.preventDefault();e.returnValue='';}});
window.addEventListener('storage',e=>{if(e.key?.startsWith(PREFIX)){if(!unsaved){try{const id=active.id;docs=readAll();if(docs.some(d=>d.id===id))select(id);else if(docs.length)select(docs[0].id);else{docs=[C.newDraft()];select(docs[0].id);}}catch{}}else toast('另一标签页有更新，保存时会为冲突编辑保留副本。');}});
try{docs=readAll();}catch{toast('浏览器存储不可用，请使用导出功能保存文章。');}
if(!docs.length){const d=C.newDraft('blank');docs=[d];}
try{select(docs[0].id);}catch{active=docs[0];list();preview();$('save-status').textContent='本地存储不可用，请导出备份';}
const mathCSS=document.createElement('link');mathCSS.rel='stylesheet';mathCSS.href='https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css';document.head.append(mathCSS);
const math=document.createElement('script');math.src='https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.js';math.onload=()=>{const auto=document.createElement('script');auto.src='https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/contrib/auto-render.min.js';auto.onload=preview;document.head.append(auto);};math.onerror=()=>{if(active?.body.includes('$'))toast('公式预览未加载；LaTeX 原文已保留，发布时由 Hugo 渲染。');};document.head.append(math);
})();
