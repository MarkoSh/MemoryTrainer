// Собирает index.html + style.css + js/*.js в один файл index.standalone.html.
// Нужно для мобильных браузеров: открытие index.html по file:// там часто не
// подгружает соседние style.css/js/*.js (каждый file:// URL — свой "origin"),
// и страница остаётся пустой. Инлайновые <style>/<script> не зависят от этого.
// Запуск: node build.js (перезапускать после правок в js/*.js или style.css).
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8')
  .replace('<link rel="stylesheet" href="style.css">', () => `<style>\n${fs.readFileSync('style.css', 'utf8')}</style>`)
  .replace(/<script src="(js\/[\w-]+\.js)"><\/script>/g, (_, src) => `<script>\n${fs.readFileSync(src, 'utf8')}</script>`);

fs.writeFileSync('index.standalone.html', html);
console.log('Wrote index.standalone.html');
