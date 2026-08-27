const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const port = Number(process.env.PORT || 8001);
const password = process.env.ADMIN_PASSWORD;
const dataRoot = path.resolve(process.env.DATA_ROOT || path.join(__dirname, '..', 'formulario ficha - legajo', 'registros'));
if (!password) { console.error('Falta ADMIN_PASSWORD. Define una contraseña antes de iniciar.'); process.exit(1); }

function send(res, status, body, type='text/plain; charset=utf-8', headers={}) { res.writeHead(status, {'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}); res.end(body); }
function authorized(req) {
  const token=(req.headers.authorization||'').replace(/^Basic\s+/i,'');
  let input=''; try { input=Buffer.from(token,'base64').toString().split(':').slice(1).join(':'); } catch {}
  const a=Buffer.from(input), b=Buffer.from(password); return a.length===b.length && crypto.timingSafeEqual(a,b);
}
function company(value) { return value==='informaperu'?'informaperu':'inre'; }
function within(base,target) { const resolved=path.resolve(base,target); return resolved.startsWith(path.resolve(base)+path.sep)?resolved:null; }
function recordsFor(name) {
  const dir=path.join(dataRoot,name); if(!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f=>/^ficha-.*\.json$/i.test(f)).map(file=>{try{return JSON.parse(fs.readFileSync(path.join(dir,file),'utf8'))}catch{return null}}).filter(Boolean).sort((a,b)=>String(b.id).localeCompare(String(a.id)));
}
const server=http.createServer((req,res)=>{
  if(!authorized(req)) return send(res,401,'Autenticación requerida','text/plain; charset=utf-8',{'WWW-Authenticate':'Basic realm="Panel privado de fichas"'});
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/registros') {
    const name=company(url.searchParams.get('empresa'));
    const rows=recordsFor(name).map(r=>({id:r.id,fecha_registro:r.fecha_registro,nombre:r.nombre,documento:r.documento,correo:r.correo,celular:r.celular,documentos:['archivo_cv','archivo_dni','archivo_certijoven','archivo_recibo','archivo_estudios','archivo_trabajo'].filter(k=>r[k]).map(k=>({tipo:k,archivo:r[k]}))}));
    return send(res,200,JSON.stringify(rows),'application/json; charset=utf-8');
  }
  if(url.pathname==='/api/excel') {
    const name=company(url.searchParams.get('empresa')), file=path.join(dataRoot,name,`fichas-${name}.csv`);
    if(!fs.existsSync(file)) return send(res,404,'Aún no existen registros.');
    res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="fichas-${name}.csv"`}); return fs.createReadStream(file).pipe(res);
  }
  if(url.pathname==='/api/documento') {
    const name=company(url.searchParams.get('empresa')), id=String(url.searchParams.get('id')||''), file=String(url.searchParams.get('archivo')||'');
    const base=path.join(dataRoot,name,'documentos',id), target=within(base,file); if(!target||!fs.existsSync(target)||path.extname(target).toLowerCase()!=='.pdf') return send(res,404,'Documento no encontrado.');
    res.writeHead(200,{'Content-Type':'application/pdf','Content-Disposition':`inline; filename="${path.basename(target).replace(/"/g,'')}"`}); return fs.createReadStream(target).pipe(res);
  }
  if(url.pathname==='/'||url.pathname==='/index.html') return fs.createReadStream(path.join(__dirname,'index.html')).pipe(res);
  send(res,404,'No encontrado');
});
server.listen(port,'0.0.0.0',()=>console.log(`Panel privado activo en http://localhost:${port}`));

