import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { normalize, searchCards } from '../search.js';
const json = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const cards = await json('../cards.json');
assert.equal(cards.length, 36);
assert.equal(new Set(cards.map(card => card.id)).size, 36);
for (const card of cards) {
  assert.ok(card.name && card.power);
  assert.ok(!('page' in card));
  await access(new URL(`../assets/cards/${card.id}.png`, import.meta.url));
}
const keys = cards.map(card => card.id).sort();
let uiKeys;
for (const language of ['fa', 'en', 'de', 'fr', 'es', 'sv', 'fi']) {
  const locale = await json(`../locales/${language}.json`);
  assert.equal(locale.language, language);
  assert.equal(locale.direction, language === 'fa' ? 'rtl' : 'ltr');
  assert.deepEqual(Object.keys(locale.cards).sort(), keys);
  if (!uiKeys) uiKeys = Object.keys(locale.ui).sort();
  assert.deepEqual(Object.keys(locale.ui).sort(), uiKeys);
  for (const card of cards) {
    assert.ok(locale.cards[card.id].description, `${language}: ${card.id}`);
    assert.equal(typeof locale.cards[card.id].notes, 'string');
    assert.ok(!('name' in locale.cards[card.id]), 'Names must stay in the shared catalog');
  }
  assert.equal(searchCards(cards, locale.cards, 'Alchemist')[0].id, 'alchemist');
  assert.equal(searchCards(cards, locale.cards, 'M.O.U.T.H.')[0].id, 'mouth');
  assert.equal(searchCards(cards, locale.cards, 'no-such-card').length, 0);
}
assert.equal(normalize('förflyttning'), normalize('forflyttning'));
assert.equal(normalize('pääliike'), normalize('paaliike'));
assert.equal(normalize('déplacement'), normalize('deplacement'));
assert.equal(normalize('teletransportación'), normalize('teletransportacion'));
assert.equal(normalize('Fähigkeit'), normalize('Fahigkeit'));
assert.equal(normalize('كارت ١'), normalize('کارت ۱'));
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
assert.ok(html.includes('id="language"'));
assert.ok(!html.includes('search-shortcut'));
assert.ok(!html.includes('صفحه‌های'));
for (const file of ['app.js', 'search.js', 'cards.json', 'styles.css']) await access(new URL(`../${file}`, import.meta.url));
console.log('Validated 36 original card names, all images, seven complete language JSON files, and multilingual search.');
