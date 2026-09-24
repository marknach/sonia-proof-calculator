(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SoniaCalculator = api;
})(globalThis, function () {
  const SONIA_BASE_ATTACK = 867;
  const IGNORE_RATIO = 0.6;
  // Max Summoner's Tower skills (formerly arena glory buildings).
  const MAX_TOWERS = Object.freeze({ defense: 20, attack: 20, windAttack: 21 });
  const MAX_GUILD_SKILLS = Object.freeze({ defense: 20, attack: 20 });
  // Official relic main-property table: +0 is 3%, +1…+14 add 1% each, +15 is 20%.
  function relicMainPercent(level) {
    if (!Number.isInteger(level) || level < 0 || level > 15) return NaN;
    return level === 15 ? 20 : level + 3;
  }

  function relicMultiplier(exclusive) {
    if (!exclusive || exclusive.type === 'none') return 0;
    const { sourceStat, perStat, percent } = exclusive;
    if (![sourceStat, perStat, percent].every((value) => Number.isFinite(value) && value >= 0) || perStat === 0) return NaN;
    return (sourceStat / perStat) * (percent / 100);
  }

  function validRelic(relic, side) {
    if (!relic) return true;
    if (!['atk', 'def', 'hp'].includes(relic.mainType) || !Number.isFinite(relicMainPercent(relic.level))) return false;
    const allowed = side === 'target' ? ['none', 'defFromAtk', 'defFromSpd', 'defFromHp'] : ['none', 'atkFromDef', 'atkFromSpd', 'atkFromHp'];
    return !relic.exclusive || (allowed.includes(relic.exclusive.type) && Number.isFinite(relicMultiplier(relic.exclusive)));
  }

  function calculate({ baseDefense, bonusDefense, defenseLeader = 0, attackLeader = 0, guildContent = false, targetRelic = null, soniaRelic = null }) {
    const values = [baseDefense, bonusDefense, defenseLeader, attackLeader];
    if (values.some((value) => !Number.isFinite(value) || value < 0) || typeof guildContent !== 'boolean' || !validRelic(targetRelic, 'target') || !validRelic(soniaRelic, 'sonia')) return null;
    const targetRelicMultiplier = relicMultiplier(targetRelic?.exclusive);
    const soniaRelicMultiplier = relicMultiplier(soniaRelic?.exclusive);
    // The entered build +DEF already includes the relic's main property.
    const defenseBeforeExclusive = baseDefense * (1 + (MAX_TOWERS.defense + (guildContent ? MAX_GUILD_SKILLS.defense : 0) + defenseLeader) / 100) + bonusDefense;
    const effectiveDefense = defenseBeforeExclusive * (1 + targetRelicMultiplier);
    const requiredTotalAttack = Math.ceil(effectiveDefense / IGNORE_RATIO - 1e-9);
    // The requested build +ATK likewise includes her relic's main property.
    const soniaBonusAttack = SONIA_BASE_ATTACK * (MAX_TOWERS.attack + MAX_TOWERS.windAttack + (guildContent ? MAX_GUILD_SKILLS.attack : 0) + attackLeader) / 100;
    const requiredBuildAttack = Math.max(0, Math.ceil(requiredTotalAttack / (1 + soniaRelicMultiplier) - SONIA_BASE_ATTACK - soniaBonusAttack - 1e-9));
    return { effectiveDefense, defenseBeforeExclusive, requiredTotalAttack, soniaBonusAttack, requiredBuildAttack, targetRelicMultiplier, soniaRelicMultiplier };
  }

  return { calculate, relicMainPercent, SONIA_BASE_ATTACK, IGNORE_RATIO, MAX_TOWERS, MAX_GUILD_SKILLS };
});
