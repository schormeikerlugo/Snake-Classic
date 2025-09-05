export const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const posEq = (a, b) => a.x === b.x && a.y === b.y;
export const getCssVar = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();