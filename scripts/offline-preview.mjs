import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('public'),out=path.resolve('.qa/offline');
fs.mkdirSync(out,{recursive:true});
fs.cpSync(root,out,{recursive:true});
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(path.join(dir,x.name)):[path.join(dir,x.name)]);}
for(const file of walk(out).filter(x=>x.endsWith('.html'))){
let html=fs.readFileSync(file,'utf8');
html=html.replace(/(<script src="[^"]*livereload[^"]*"[^>]*><\/script>)/g,'');
html=html.replace(/\b(href|src)="(\/[^"]*)"/g,(_,attr,url)=>{
const [pathname,hash]=url.split('#');let target=path.join(out,decodeURI(pathname));
if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');
if(!fs.existsSync(target))return attr+'="https://wrp-wrp.github.io'+url+'"';
const relative=path.relative(path.dirname(file),target).split(path.sep).join('/');
return attr+'="'+relative+(hash?'#'+hash:'')+'"';
});
fs.writeFileSync(file,html);
}
console.log(out);
