/* Pure helpers shared by the writing UI and regression tests. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StudioCore=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
'use strict';
const repo='wrp-wrp/wrp-wrp.github.io',fence=String.fromCharCode(96).repeat(3);
const fields=['title','date','summary','tags','journalCategory','contentLanguage','hidden','draft','math'];
const templates={
blank:'',
paper:'## 这篇论文在解决什么问题？\n\n先用一句话解释问题。\n\n## 最直观的想法\n\n它是怎么想到这个方法的？\n\n## 方法与关键设计\n\n## 实验说明了什么？\n\n## 局限与我的疑问\n\n## 参考链接\n',
engineering:'## 背景与目标\n\n## 方案与取舍\n\n## 实现记录\n\n'+fence+'cpp\n// 在这里记录关键代码\n'+fence+'\n\n## 验证与结果\n\n## 还有哪些问题？\n',
life:'## 想记录的一件事\n\n\n## 后来想到的\n\n'
};
const today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'});
const newDraft=(type='blank')=>({id:crypto.randomUUID(),title:'',summary:'',body:templates[type]||'',date:today(),tags:[],category:type==='life'?'life':'research',language:'zh-CN',hidden:false,slug:'note-'+today().replaceAll('-','')+'-'+crypto.randomUUID().slice(0,6),updatedAt:new Date().toISOString(),extraFrontmatter:''});
function validate(d){
if(!d.title.trim())throw new Error('先给文章起一个标题。');
if(!d.body.trim())throw new Error('正文还是空的，先写下一点内容吧。');
if(!/^[A-Za-z0-9][A-Za-z0-9/_-]{0,160}$/.test(d.slug)||d.slug.includes('//')||d.slug.endsWith('/'))throw new Error('文章目录只支持字母、数字、短横线、下划线和路径分隔符。');
if(!/^\d{4}-\d{2}-\d{2}/.test(d.date)||isNaN(Date.parse(d.date)))throw new Error('请选择有效日期。');
return d;
}
function serialize(d,draft=true){
validate(d);
const q=JSON.stringify;
return '+++\n'+[
'title = '+q(d.title),'date = '+q(d.date.length===10?d.date+'T12:00:00+08:00':d.date),
'draft = '+draft,'hidden = '+Boolean(d.hidden),'summary = '+q(d.summary||''),
'tags = '+q(d.tags||[]),'journalCategory = '+q(d.category||'research'),
'contentLanguage = '+q(d.language||'zh-CN'),'math = true',
d.extraFrontmatter||''
].filter(Boolean).join('\n')+'\n+++\n\n'+d.body.replace(/^\n+/,'')+'\n';
}
function scalar(v){
v=v.trim();
if(v==='true'||v==='false')return v==='true';
if(v.startsWith("'''")&&v.endsWith("'''"))return v.slice(3,-3).replace(/^\n/,'');
if(v.startsWith('"""')&&v.endsWith('"""'))return v.slice(3,-3).replace(/^\n/,'');
if(v.startsWith("'")&&v.endsWith("'"))return v.slice(1,-1);
if(v.startsWith('"'))return JSON.parse(v);
if(v.startsWith('[')){
const values=[];const re=/"(?:[^"\\]|\\.)*"|'[^']*'/g;let m;
while((m=re.exec(v)))values.push(scalar(m[0]));
const rest=v.replace(re,'').replace(/[\[\],\s]/g,'');if(rest)throw new Error('暂不支持这个标签数组格式。');
return values;
}
if(/^\d{4}-\d{2}-\d{2}/.test(v))return v;
throw new Error('不能读取这项元数据。');
}
function parse(text,filename='imported.md'){
text=text.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n');
const d=newDraft();d.slug=filename.replace(/\.(md|markdown)$/i,'').replace(/[^A-Za-z0-9_-]/g,'-').replace(/^-+|-+$/g,'')||d.slug;
if(/^---\n/.test(text))throw new Error('请使用纯 Markdown 或 Hugo TOML（+++）格式；YAML 文件请先转换，避免丢失元数据。');
if(!text.startsWith('+++\n')){d.body=text;d.title=(text.match(/^#\s+(.+)$/m)||[])[1]||'';return d;}
const end=text.indexOf('\n+++\n',4);if(end<0)throw new Error('没有找到完整的 TOML 元数据结束标记。');
const header=text.slice(4,end), lines=header.split('\n'), meta={}, extra=[];
for(let i=0;i<lines.length;i++){
const line=lines[i],m=line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
if(!m||!fields.includes(m[1])){extra.push(line);continue;}
let value=m[2];const triple=value.startsWith('"""')?'"""':value.startsWith("'''")?"'''":null;
if(triple&&(value.length<6||!value.slice(3).includes(triple))){while(++i<lines.length){value+='\n'+lines[i];if(lines[i].includes(triple))break;}}
if(value.startsWith('[')&&!value.includes(']'))while(++i<lines.length){value+='\n'+lines[i];if(lines[i].includes(']'))break;}
try{meta[m[1]]=scalar(value);}catch{throw new Error('无法安全读取 '+m[1]+'，原文件未修改。请简化该字段格式后重试。');}
}
d.title=typeof meta.title==='string'?meta.title:'';d.summary=typeof meta.summary==='string'?meta.summary:'';
d.date=meta.date||today();d.tags=Array.isArray(meta.tags)?meta.tags:[];d.category=meta.journalCategory||'research';d.language=meta.contentLanguage||'zh-CN';d.hidden=meta.hidden===true;
d.body=text.slice(end+5).replace(/^\n+/,'');d.extraFrontmatter=extra.join('\n').trim();return d;
}
function utf8base64(text){const bytes=new TextEncoder().encode(text);let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary);}
function fromBase64(text){const binary=atob(text.replace(/\s/g,''));return new TextDecoder().decode(Uint8Array.from(binary,c=>c.charCodeAt(0)));}
function safeBackup(text){
const data=JSON.parse(text);
if(data.version!==1||!Array.isArray(data.drafts)||data.drafts.length>300)throw new Error('这不是有效的草稿备份。');
return data.drafts.map(d=>{
if(!d||typeof d.title!=='string'||typeof d.body!=='string'||d.body.length>2000000||typeof d.slug!=='string'||!Array.isArray(d.tags)||d.tags.some(t=>typeof t!=='string'))throw new Error('备份内容损坏，未导入任何草稿。');
const allowed=['title','summary','body','date','slug','tags','category','language','hidden','extraFrontmatter'];
const v={...newDraft(),...Object.fromEntries(allowed.filter(k=>k in d).map(k=>[k,d[k]])),id:crypto.randomUUID()};
for(const key of ['summary','date','category','language','extraFrontmatter'])if(typeof v[key]!=='string')throw new Error('备份元数据格式不正确。');
return v;
});
}
async function github(token,path,options={}){
const response=await fetch('https://api.github.com/repos/'+repo+'/'+path,{...options,signal:AbortSignal.timeout(20000),headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',Authorization:'Bearer '+token,'Content-Type':'application/json',...options.headers}});
if(response.status===404&&options.allowMissing)return null;
if(!response.ok){const messages={401:'令牌无效或已过期，请重新连接。',403:'没有写入权限或请求额度已用尽，请检查仓库 Contents 权限。',404:'没有找到仓库、分支或文章，请检查连接配置。',409:'文章版本已变化，请先读取仓库版本再合并修改。',422:'提交被拒绝：文章可能已存在，或分支受保护。请读取仓库版本后重试。'};throw new Error(messages[response.status]||'GitHub 请求失败（'+response.status+'）。');}
return response.json();
}
const contentPath=d=>'contents/'+('content/posts/'+d.slug+'/index.md').split('/').map(encodeURIComponent).join('/');
async function publish(token,branch,d,live){
validate(d);
const current=await github(token,contentPath(d)+'?ref='+encodeURIComponent(branch),{allowMissing:true});
if(current&&(!d.gitSha||current.sha!==d.gitSha||d.gitBranch!==branch||d.gitPath!==d.slug))throw new Error('仓库已有同名文章，或版本已变化。请先备份当前草稿，再读取仓库文章后合并，避免覆盖。');
if(!current&&d.gitSha)throw new Error('仓库文章已被移动或删除，请检查文章目录。');
const payload={message:(current?'Update: ':'Write: ')+d.title,content:utf8base64(serialize(d,!live)),branch};
if(current)payload.sha=current.sha;
return github(token,contentPath(d),{method:'PUT',body:JSON.stringify(payload)});
}
return{repo,templates,today,newDraft,validate,serialize,parse,utf8base64,fromBase64,safeBackup,github,contentPath,publish};
});
