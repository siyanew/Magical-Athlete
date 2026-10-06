export function normalize(value) {
  return value.normalize('NFKD').toLowerCase().replace(/\p{M}/gu, '')
    .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/ß/g, 'ss')
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[\u200c\u200d\u0640]/g, '').replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ').trim();
}
export function searchCards(cards, translations, query) {
  const words = normalize(query).split(' ').filter(Boolean);
  return cards.filter((card) => {
    const { description, notes } = translations[card.id];
    const searchable = normalize(`${card.name} ${card.power} ${description} ${notes}`);
    return words.every((word) => searchable.includes(word));
  });
}
