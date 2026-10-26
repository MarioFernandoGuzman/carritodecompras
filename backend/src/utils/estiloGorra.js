export function estiloGorra(categoria, slug) {
  return ({ snapback: 'snapback', 'dad-hat': 'dad', trucker: 'trucker' })[categoria]
    || (slug.startsWith('beanie-') ? 'beanie' : 'bucket');
}
