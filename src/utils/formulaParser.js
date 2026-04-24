// Basic atomic weights for common elements
const atomicWeights = {
  H: 1.008, He: 4.0026, Li: 6.94, Be: 9.0122, B: 10.81, C: 12.011, N: 14.007,
  O: 15.999, F: 18.998, Ne: 20.180, Na: 22.990, Mg: 24.305, Al: 26.982, Si: 28.085,
  P: 30.974, S: 32.06, Cl: 35.45, K: 39.098, Ar: 39.95, Ca: 40.078, Sc: 44.956,
  Ti: 47.867, V: 50.942, Cr: 51.996, Mn: 54.938, Fe: 55.845, Ni: 58.693, Co: 58.933,
  Cu: 63.546, Zn: 65.38, Ga: 69.723, Ge: 72.63, As: 74.922, Se: 78.971, Br: 79.904,
  Kr: 83.798, Rb: 85.468, Sr: 87.62, Y: 88.906, Zr: 91.224, Nb: 92.906, Mo: 95.95,
  Ru: 101.07, Rh: 102.91, Pd: 106.42, Ag: 107.87, Cd: 112.41, In: 114.82, Sn: 118.71,
  Sb: 121.76, Te: 127.60, I: 126.90, Xe: 131.29, Cs: 132.91, Ba: 137.33, W: 183.84,
  Pt: 195.08, Au: 196.97, Hg: 200.59, Pb: 207.2, Bi: 208.98, U: 238.03
};

/**
 * Calculates the molecular weight of a given chemical formula.
 * @param {string} formula - The chemical formula (e.g. H2O, C6H12O6)
 * @returns {number|null} - Molecular weight or null if invalid
 */
export function calculateMolecularWeight(formula) {
  if (!formula || typeof formula !== 'string') return null;
  
  // Basic validation: must start with a capital letter
  if (!/^[A-Z]/.test(formula)) return null;

  let mw = 0;
  // Match elements and their optional numbers: e.g., C, H12, O6, Na, Cl
  const regex = /([A-Z][a-z]*)(\d*)/g;
  let match;
  let lastIndex = 0;

  while ((match = regex.exec(formula)) !== null) {
    // If there's a gap in matching, the formula has invalid characters
    if (match.index !== lastIndex) {
      return null;
    }
    
    const element = match[1];
    const countStr = match[2];
    const count = countStr ? parseInt(countStr, 10) : 1;

    if (!atomicWeights[element]) {
      return null; // Unknown element
    }

    mw += atomicWeights[element] * count;
    lastIndex = regex.lastIndex;
  }
  
  if (lastIndex !== formula.length) {
    return null; // Formula wasn't fully parsed
  }

  return Number(mw.toFixed(3));
}
