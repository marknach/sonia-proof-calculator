const byId = (id) => document.getElementById(id);
const inputs = ['bonusDefense', 'defenseLeader', 'attackLeader', 'targetRelicType', 'targetRelicLevel', 'targetExclusive', 'targetSource', 'targetPer', 'targetPercent', 'soniaRelicType', 'soniaRelicLevel', 'soniaExclusive', 'soniaSource', 'soniaPer', 'soniaPercent'];
let units = [];
let selected = null;
let matches = [];
let activeIndex = -1;
const format = (number) => Math.round(number).toLocaleString();

function setSelected(unit) {
  selected = unit;
  byId('unitInput').value = `${unit.name} · ${unit.element}`;
  byId('selectedUnit').textContent = `Base DEF ${format(unit.baseDefense)} · ${unit.element}`;
  hideOptions();
  renderResult();
}

function hideOptions() {
  byId('unitOptions').hidden = true;
  byId('unitInput').setAttribute('aria-expanded', 'false');
  byId('unitInput').removeAttribute('aria-activedescendant');
  activeIndex = -1;
}

function showOptions() {
  const query = byId('unitInput').value.trim().toLowerCase();
  matches = units.filter((unit) => `${unit.name} ${unit.element}`.toLowerCase().includes(query)).slice(0, 12);
  const options = byId('unitOptions');
  options.replaceChildren();
  matches.forEach((unit, index) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.id = `unit-option-${index}`;
    option.role = 'option';
    option.className = 'option';
    option.setAttribute('aria-selected', 'false');
    const name = document.createElement('span');
    name.textContent = unit.name;
    const detail = document.createElement('small');
    detail.textContent = `${unit.element} · ${format(unit.baseDefense)} DEF`;
    option.append(name, detail);
    option.addEventListener('mousedown', (event) => event.preventDefault());
    option.addEventListener('click', () => setSelected(unit));
    options.append(option);
  });
  options.hidden = matches.length === 0;
  byId('unitInput').setAttribute('aria-expanded', String(matches.length > 0));
}

function focusOption(index) {
  activeIndex = index;
  [...byId('unitOptions').children].forEach((option, item) => option.setAttribute('aria-selected', String(item === index)));
  byId('unitInput').setAttribute('aria-activedescendant', `unit-option-${index}`);
  byId(`unit-option-${index}`).scrollIntoView({ block: 'nearest' });
}

function readPercent(id) {
  const element = byId(id);
  if (element.value === '') return NaN;
  const value = Number(element.value);
  return value <= 100 ? value : NaN;
}

function readNumber(id) {
  const value = byId(id).value;
  return value === '' ? NaN : Number(value);
}

function readRelic(side) {
  if (!byId('includeRelics').checked) return null;
  const type = byId(`${side}Exclusive`).value;
  return {
    mainType: byId(`${side}RelicType`).value,
    level: readNumber(`${side}RelicLevel`),
    exclusive: type === 'none' ? { type } : {
      type,
      sourceStat: readNumber(`${side}Source`),
      perStat: readNumber(`${side}Per`),
      percent: readNumber(`${side}Percent`),
    },
  };
}

function renderResult() {
  const body = byId('resultBody');
  if (!selected) {
    body.className = 'empty';
    body.textContent = 'Choose a target unit to see the threshold.';
    return;
  }
  const bonusDefense = byId('bonusDefense').value === '' ? NaN : Number(byId('bonusDefense').value);
  const result = SoniaCalculator.calculate({
    baseDefense: selected.baseDefense,
    bonusDefense,
    defenseLeader: byId('defenseLeaderEnabled').checked ? readPercent('defenseLeader') : 0,
    attackLeader: byId('attackLeaderEnabled').checked ? readPercent('attackLeader') : 0,
    guildContent: byId('guildContent').checked,
    targetRelic: readRelic('target'),
    soniaRelic: readRelic('sonia'),
  });
  if (!result) {
    body.className = 'empty error';
    body.textContent = 'Check the inputs: values must be nonnegative, leader bonuses at most 100%, and relic “per N” greater than zero.';
    return;
  }
  body.className = '';
  body.innerHTML = `<div class="hero-value"><span>Needed +ATK on Sonia</span><strong>+${format(result.requiredBuildAttack)}</strong><small>Add this much ATK on her build to meet Guard Crush’s ignore condition.</small></div><div class="stat-grid"><div><span>Target combat DEF</span><strong>${format(result.effectiveDefense)}</strong></div><div><span>Minimum Sonia total ATK</span><strong>${format(result.requiredTotalAttack)}</strong></div></div><p class="result-note">${byId('guildContent').checked ? 'Guild content · ' : ''}Sonia’s base ATK: 867 · base-stat bonuses from towers, lead, and relic: +${format(result.soniaBonusAttack)}${result.soniaRelicMultiplier ? ` · Sonia exclusive effect: +${(result.soniaRelicMultiplier * 100).toFixed(1)}% ATK` : ''}${result.targetRelicMultiplier ? ` · target exclusive effect: +${(result.targetRelicMultiplier * 100).toFixed(1)}% DEF` : ''}.</p>`;
}

byId('unitInput').addEventListener('input', () => {
  selected = null;
  byId('selectedUnit').textContent = 'Select a unit to use its level 40 base DEF.';
  showOptions();
  renderResult();
});
byId('unitInput').addEventListener('focus', showOptions);
byId('unitInput').addEventListener('keydown', (event) => {
  if (event.key === 'Escape') return hideOptions();
  if (!matches.length || byId('unitOptions').hidden) return;
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    focusOption((activeIndex + (event.key === 'ArrowDown' ? 1 : matches.length - 1)) % matches.length);
  } else if (event.key === 'Enter') {
    event.preventDefault();
    setSelected(matches[Math.max(activeIndex, 0)]);
  }
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.typeahead')) hideOptions();
});
inputs.forEach((id) => byId(id).addEventListener('input', renderResult));
byId('guildContent').addEventListener('change', renderResult);
for (const side of ['target', 'sonia']) {
  const level = byId(`${side}RelicLevel`);
  for (let value = 0; value <= 15; value++) {
    const option = document.createElement('option');
    option.value = String(value);
    option.textContent = `+${value} · ${SoniaCalculator.relicMainPercent(value)}%`;
    level.append(option);
  }
  byId(`${side}Exclusive`).addEventListener('change', () => {
    byId(`${side}ExclusiveFields`).hidden = byId(`${side}Exclusive`).value === 'none';
  });
}
byId('includeRelics').addEventListener('change', () => {
  byId('relicFields').hidden = !byId('includeRelics').checked;
  renderResult();
});
[['defenseLeaderEnabled', 'defenseLeader'], ['attackLeaderEnabled', 'attackLeader']].forEach(([checkId, fieldId]) => {
  byId(checkId).addEventListener('change', () => {
    byId(fieldId).disabled = !byId(checkId).checked;
    renderResult();
  });
});

fetch('./units.json').then((response) => {
  if (!response.ok) throw new Error('Unit data unavailable');
  return response.json();
}).then((data) => {
  units = data;
  byId('dataStatus').textContent = `${units.length.toLocaleString()} units ready`;
}).catch(() => {
  byId('dataStatus').textContent = 'Could not load unit data';
});
