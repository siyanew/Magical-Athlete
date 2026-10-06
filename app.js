import { searchCards } from './search.js';

const $ = (id) => document.getElementById(id);
const languages = ['en', 'fa', 'de', 'fr', 'es', 'sv', 'fi'];
const defaultLanguage = 'en';
const storageKey = 'magical-athlete-language';
const colors = ['#e9e2fa', '#e1f1ff', '#fff0ba', '#fbe1ea', '#dff1e8', '#ffe4d3'];
const grid = $('cards');
const search = $('search');
const dialog = $('card-dialog');
const picker = $('language');
const localeCache = new Map();
let cards = [];
let locale;
let currentLanguage = defaultLanguage;
let requestedLanguage = defaultLanguage;
let languageRequest = 0;
let previousFocus;

const number = (value) => value.toLocaleString(currentLanguage);
function text(key, values = {}) {
  return locale.ui[key].replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');
}
async function readJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url}`);
  return response.json();
}
// Use text nodes for translations, including editable JSON content.
function element(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
}
function descriptionElement(tag, className, content) {
  const node = element(tag, className);
  // Isolate original English names so mixed Persian/English paragraphs read correctly.
  const names = cards.map(card => card.name).sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(${names.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  for (const part of content.split(pattern)) {
    if (names.includes(part)) {
      const name = element('bdi', '', part);
      name.lang = 'en';
      name.dir = 'ltr';
      node.append(name);
    } else node.append(document.createTextNode(part));
  }
  return node;
}
function openCard(card) {
  previousFocus = document.activeElement;
  const translation = locale.cards[card.id];
  $('dialog-title').textContent = card.name;
  $('dialog-power').textContent = card.power;
  $('dialog-ability').replaceChildren(...descriptionElement('p', '', translation.description).childNodes);
  $('dialog-notes').replaceChildren(...descriptionElement('p', '', translation.notes).childNodes);
  $('dialog-notes-wrap').hidden = !translation.notes;
  $('dialog-image').src = `assets/cards/${card.id}.png`;
  $('dialog-image').alt = text('cardImage', { name: card.name });
  dialog.showModal();
  document.body.style.overflow = 'hidden';
}
function render() {
  if (!locale) return;
  const matches = searchCards(cards, locale.cards, search.value);
  const fragment = document.createDocumentFragment();
  for (const card of matches) {
    const index = cards.indexOf(card);
    const translation = locale.cards[card.id];
    const article = element('article', 'racer-card');
    article.style.setProperty('--accent', colors[index % colors.length]);
    const art = element('div', 'card-art');
    const ordinal = element('span', 'card-number', String(index + 1).padStart(2, '0'));
    ordinal.dir = 'ltr';
    const imageFrame = element('div', 'card-image');
    const image = element('img');
    image.src = `assets/cards/${card.id}.png`;
    image.alt = text('cardImage', { name: card.name });
    image.width = 339;
    image.height = 472;
    image.loading = index < 8 ? 'eager' : 'lazy';
    image.decoding = 'async';
    imageFrame.append(image);
    art.append(ordinal, imageFrame);
    const copy = element('div', 'card-copy');
    const title = element('h2', 'card-name', card.name);
    title.lang = 'en';
    title.dir = 'ltr';
    const power = element('span', 'power-label', card.power);
    power.lang = 'en';
    power.dir = 'ltr';
    copy.append(title, power, descriptionElement('p', 'ability', translation.description));
    if (translation.notes) {
      const bottom = element('div', 'card-bottom');
      bottom.append(element('span', 'notes-button', text('notes')));
      copy.append(bottom);
    }
    const openButton = element('button', 'card-open');
    openButton.type = 'button';
    openButton.setAttribute('aria-label', text('viewCard', { name: card.name }));
    openButton.setAttribute('aria-haspopup', 'dialog');
    openButton.setAttribute('aria-controls', 'card-dialog');
    openButton.addEventListener('click', () => openCard(card));
    article.append(art, copy, openButton);
    fragment.append(article);
  }
  grid.replaceChildren(fragment);
  $('result-count').textContent = text(search.value.trim() ? 'filteredCount' : 'count', {
    count: number(matches.length), total: number(cards.length),
  });
  $('empty').hidden = matches.length !== 0;
  $('clear-search').hidden = search.value.length === 0;
}
function localizeUI() {
  document.documentElement.lang = currentLanguage;
  document.documentElement.dir = locale.direction;
  document.title = text('title');
  document.querySelector('meta[name="description"]').content = text('searchLabel');
  const labels = {
    'brand-title': 'title', 'page-title': 'heading', 'language-label': 'language',
    'search-label': 'searchLabel', 'search-hint': 'searchHint', 'empty-title': 'emptyTitle',
    'empty-description': 'emptyDescription', 'reset-search': 'resetSearch',
    'dialog-notes-title': 'notes', 'retry-load': 'retry',
    'footer-contribute': 'footerContribute', 'footer-github': 'footerGitHub',
  };
  for (const [id, key] of Object.entries(labels)) $(id).textContent = text(key);
  search.placeholder = text('searchPlaceholder');
  $('clear-search').setAttribute('aria-label', text('clearSearch'));
  $('close-dialog').setAttribute('aria-label', text('close'));
  grid.setAttribute('aria-label', text('cardsLabel'));
}
async function setLanguage(language) {
  if (!languages.includes(language)) language = defaultLanguage;
  requestedLanguage = language;
  const request = ++languageRequest;
  picker.value = language;
  grid.setAttribute('aria-busy', 'true');
  $('load-error').hidden = true;
  try {
    const [catalog, translation] = await Promise.all([
      cards.length ? cards : readJSON('cards.json'),
      localeCache.get(language) ?? readJSON(`locales/${language}.json`),
    ]);
    if (request !== languageRequest) return;
    localeCache.set(language, translation);
    cards = catalog;
    locale = translation;
    currentLanguage = language;
    if (dialog.open) dialog.close();
    localizeUI();
    render();
    try { localStorage.setItem(storageKey, language); } catch { /* Storage may be disabled. */ }
  } catch {
    if (request !== languageRequest) return;
    picker.value = currentLanguage;
    $('load-error-text').textContent = locale ? text('loadError') : 'Could not load the cards. Please try again.';
    $('load-error').hidden = false;
  } finally {
    if (request === languageRequest) grid.setAttribute('aria-busy', 'false');
  }
}
function resetSearch() { search.value = ''; render(); search.focus(); }
search.addEventListener('input', render);
picker.addEventListener('change', () => setLanguage(picker.value));
$('retry-load').addEventListener('click', () => setLanguage(requestedLanguage));
$('clear-search').addEventListener('click', resetSearch);
$('reset-search').addEventListener('click', resetSearch);
document.querySelector('form').addEventListener('submit', (event) => event.preventDefault());
$('close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  const bounds = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
});
dialog.addEventListener('close', () => { document.body.style.overflow = ''; previousFocus?.focus(); });
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && document.activeElement === search && search.value) resetSearch();
});
let savedLanguage;
try { savedLanguage = localStorage.getItem(storageKey); } catch { /* Use the default without storage. */ }
setLanguage(languages.includes(savedLanguage) ? savedLanguage : defaultLanguage);
