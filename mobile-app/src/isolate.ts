// Wraps text in a Unicode "first strong isolate" so RTL content (e.g. Arabic)
// keeps its own direction without reordering the surrounding content.
export const isolate = (text: string = '') => `⁨${text}⁩`;
