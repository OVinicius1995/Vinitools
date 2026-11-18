import fs from 'node:fs';
import assert from 'node:assert/strict';
const programs = JSON.parse(fs.readFileSync(new URL('./programas.json',import.meta.url),'utf8'));
const escape = s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const template = "<article class=\"card\"><div class=\"cardin\"><div class=\"producttop\"><span class=\"appicon\"><img src=\"{icon}\" alt=\"\" width=\"43\" height=\"43\"></span><span class=\"version\">v{version}</span></div><div class=\"category\">{category}</div><h3>{name}</h3><p class=\"desc\">{summary}</p><div class=\"dlrow\"><a class=\"download\" aria-label=\"Baixar {name} para Windows x64\" href=\"{downloadUrl}\"><svg aria-hidden=\"true\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5\"/></svg>Baixar para Windows</a><span class=\"filetype\">.exe · x64</span></div><div class=\"download-count\" title=\"Downloads do instalador no GitHub\"></div></div><details><summary>Como usar {name}</summary><div class=\"details\"><ol>{steps}</ol><p>{installNote}</p><a class=\"repo\" href=\"https://github.com/OVinicius1995/{repo}\">Repositório no GitHub ↗</a></div></details></article>";
function renderCard(program) {
  const icon = fs.readFileSync(new URL('./assets/' + program.icon, import.meta.url));
  const mime = {png: 'image/png', svg: 'image/svg+xml'}[program.icon.split('.').pop()];
  assert.ok(mime, 'Ícone precisa estar em PNG ou SVG');
  return template.replace(/\{(\w+)\}/g, (_, field) => {
    if (field === 'icon') return 'data:' + mime + ';base64,' + icon.toString('base64');
    if (field === 'steps') return program.steps.map(step => '<li>' + escape(step) + '</li>').join('');
    return escape(program[field]);
  });
}

const layout = fs.readFileSync(new URL('./src/pagina.tmpl', import.meta.url), 'utf8');
const page = layout
  .replace('__COUNT__', String(programs.length).padStart(2, '0'))
  .replace('__CARDS__', () => programs.map(renderCard).join('\n'));
assert.ok(!/__COUNT__|__CARDS__/.test(page), 'O catálogo contém marcadores de modelo');
for (const program of programs) assert.ok(page.includes('href="' + escape(program.downloadUrl) + '"'));

fs.writeFileSync(new URL('./index.html', import.meta.url), page);
if (fs.existsSync(new URL('./.openai/hosting.json', import.meta.url))) {
  fs.mkdirSync(new URL('./dist/', import.meta.url), {recursive: true});
  fs.writeFileSync(new URL('./dist/index.html', import.meta.url), page);
}
