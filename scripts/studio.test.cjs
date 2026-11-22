const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../static/js/studio-core.js');
const doc=()=>({...C.newDraft(),title:'测试 "中文" 🐈',body:'## 结论\n\n汉字与 UTF-8。\n\n'+String.fromCharCode(96).repeat(3)+'cpp\nint x = 1;\n'+String.fromCharCode(96).repeat(3),summary:'引号 " 与换行\n第二行',tags:['向量检索','a,b']});
test('UTF-8 content survives base64 round trip',()=>assert.equal(C.fromBase64(C.utf8base64(doc().body)),doc().body));
test('TOML export/import preserves content, quotes, metadata and language',()=>{const d=doc();d.extraFrontmatter='title_en = "English title"\ncustom = 42';const parsed=C.parse(C.serialize(d,false),'note.md');for(const k of ['title','summary','tags','language','category'])assert.deepEqual(parsed[k],d[k]);assert.equal(parsed.body.trim(),d.body.trim());assert.equal(parsed.extraFrontmatter,d.extraFrontmatter);});
test('existing blog articles import without metadata loss',()=>{for(const name of fs.readdirSync('content/posts')){const p=path.join('content/posts',name,'index.md');if(!fs.existsSync(p))continue;const d=C.parse(fs.readFileSync(p,'utf8'),name+'.md');assert.ok(d.title);assert.ok(d.body);const again=C.parse(C.serialize(d,true));assert.equal(again.title,d.title);assert.equal(again.body.trim(),d.body.trim());}});
test('rejects path traversal, missing content and invalid backups',()=>{for(const slug of ['../x','a/../b','/root','a//b','x/','x?y'])assert.throws(()=>C.serialize({...doc(),slug}));assert.throws(()=>C.serialize({...doc(),title:''}));assert.throws(()=>C.safeBackup('{"version":1,"drafts":[{"body":22}]}'));assert.throws(()=>C.parse('---\ntitle: hello\n---\nbody'));});
test('backup import excludes credentials and GitHub version state',()=>{const d=doc();const v=C.safeBackup(JSON.stringify({version:1,drafts:[{...d,token:'secret',gitSha:'old'}]}))[0];assert.equal(v.token,undefined);assert.equal(v.gitSha,undefined);assert.notEqual(v.id,d.id);});
test('new GitHub article is UTF-8 and remains draft by default',async()=>{const previous=global.fetch;let call=0,payload;global.fetch=async(url,opts)=>{call++;if(call===1)return{status:404,ok:false};payload=JSON.parse(opts.body);return{ok:true,json:async()=>({content:{sha:'new'}})};};try{await C.publish('fake-test-token','master',doc(),false);assert.equal(call,2);assert.equal(payload.branch,'master');assert.match(C.fromBase64(payload.content),/draft = true/);assert.equal(payload.sha,undefined);}finally{global.fetch=previous;}});
test('conflicting GitHub file never sends a write',async()=>{const previous=global.fetch;let calls=0;global.fetch=async()=>{calls++;return{ok:true,json:async()=>({sha:'remote-changed'})}};try{await assert.rejects(C.publish('fake-test-token','master',{...doc(),gitSha:'older'},true),/版本已变化/);assert.equal(calls,1);}finally{global.fetch=previous;}});
test('matching remote version uses optimistic SHA and explicit public flag',async()=>{const previous=global.fetch;const d=doc();d.gitSha='current';d.gitBranch='master';d.gitPath=d.slug;let payload;global.fetch=async(url,opts)=>{if(opts.method==='PUT'){payload=JSON.parse(opts.body);return{ok:true,json:async()=>({content:{sha:'new'}})};}return{ok:true,json:async()=>({sha:'current'})};};try{await C.publish('fake-test-token','master',d,true);assert.equal(payload.sha,'current');assert.match(C.fromBase64(payload.content),/draft = false/);}finally{global.fetch=previous;}});
test('generated site keeps original routes, hides drafts and renders math', () => {
  const page = file => fs.readFileSync(path.join('public', file), 'utf8');
  const home = page('index.html');
  const blog = page('posts/index.html');
  const article = page('posts/networkreview/index.html');
  const studio = page('studio/index.html');
  const about = page('about/index.html');
  assert.ok(home.includes('/images/home-avatar.jpg'));
  assert.ok(home.includes('VLDB 2027'));
  assert.ok(!/Under shepherding|Affiliation|Location|Education/.test(home));
  assert.ok(!/resources[/"]|archive[/"]/.test(home));
  assert.ok(!blog.includes('计算理论学习笔记'));
  assert.ok(blog.includes('post-tag') && blog.includes('向量检索'));
  assert.ok(/class="?katex\b/.test(article));
  assert.ok(article.includes('katex.min.css'));
  assert.ok(studio.includes('noindex,nofollow') && studio.includes('data-slug=NetWorkReview'));
  assert.ok(about.includes('Problem Setting') && about.includes('/resume/'));
  for (const route of ['archive', 'blog', 'tags']) {
    assert.ok(/url=([^"]+)?\/posts\//.test(page(route + '/index.html')), route);
  }
});

test('editing existing Markdown preserves draft state, time zone and disabled math', () => {
  const original = '+++\ntitle = "Notes"\ndate = "2026-05-10T08:30:00+08:00"\ndraft = false\nmath = false\ntitle_en = "Notes"\ntags = ["WASM"]\n+++\n\nBody';
  const post = C.parse(original);
  assert.equal(post.wasDraft, false);
  const output = C.parse(C.serialize(post, post.wasDraft));
  assert.equal(output.wasDraft, false);
  assert.equal(output.date, '2026-05-10T08:30:00+08:00');
  assert.equal(output.math, false);
  assert.equal(output.extraFrontmatter, 'title_en = "Notes"');
});
