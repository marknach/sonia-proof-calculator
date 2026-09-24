(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SoniaCalculator = api;
})(globalThis, function () {
  const SONIA_BASE_ATTACK = 867;
  const IGNORE_RATIO = 0.6;

  function calculate({ baseDefense, bonusDefense, defenseTower = 20, defenseLeader = 0, attackTower = 20, windTower = 21, attackLeader = 0 }) {
    const values = [baseDefense, bonusDefense, defenseTower, defenseLeader, attackTower, windTower, attackLeader];
    if (values.some((value) => !Number.isFinite(value) || value < 0)) return null;
    const effectiveDefense = baseDefense * (1 + (defenseTower + defenseLeader) / 100) + bonusDefense;
    const requiredTotalAttack = Math.ceil(effectiveDefense / IGNORE_RATIO - 1e-9);
    const soniaBonusAttack = SONIA_BASE_ATTACK * (attackTower + windTower + attackLeader) / 100;
    const requiredBuildAttack = Math.max(0, Math.ceil(requiredTotalAttack - SONIA_BASE_ATTACK - soniaBonusAttack - 1e-9));
    return { effectiveDefense, requiredTotalAttack, soniaBonusAttack, requiredBuildAttack };
  }

  return { calculate, SONIA_BASE_ATTACK, IGNORE_RATIO };
});
