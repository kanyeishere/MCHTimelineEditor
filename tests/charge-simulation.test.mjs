import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8');

function extractFunction(name) {
  const start = source.indexOf(`function ${name}`);
  assert.notEqual(start, -1, `missing function ${name}`);
  let depth = 0;
  for (let index = start; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`unterminated function ${name}`);
}

const chargeHarness = `
const DEFAULT_GCD_SECONDS = 2.5;
const START_TIME_SECONDS = -15;
const TIME_EPSILON = 1e-6;
const actionsById = { drill: { recast: 20, charges: 2 } };
function getReductionEventTimes() { return []; }
${extractFunction('getChargeRecoveryTime')}
${extractFunction('getDrillChargesFromEnergy')}
${extractFunction('simulateDrillEnergyState')}
${extractFunction('simulateChargeState')}
`;

const chargeContext = {};
Function('context', `with (context) { ${chargeHarness}; context.simulateChargeState = simulateChargeState; }`)(chargeContext);

let state = chargeContext.simulateChargeState('drill', 82.5, [62.5, 82.5], {});
assert.equal(state.energy, 20, 'Drill should spend 20 energy at 82.5s');
assert.equal(state.charges, 1, '20 Drill energy should display as one charge');
assert.equal(state.nextRecoveryTime, 102.5, 'Drill should be full again 20s after spending from 40 to 20');
assert.deepEqual(state.recoveryEvents, [82.5], 'Drill CD reminders should only fire when energy reaches 40');

state = chargeContext.simulateChargeState('drill', 82.5, [62.5, 80, 82.5], {});
assert.equal(state.energy, 0, 'Drill should be empty after spending at 80s and again at 82.5s');
assert.equal(state.charges, 0, 'less than 20 Drill energy should display as zero charges');
assert.equal(state.nextRecoveryTime, 122.5, 'Drill should be full again after recovering from 0 to 40');

state = chargeContext.simulateChargeState('drill', 215, [160, 180, 212.5], {});
assert.equal(state.energy, 22.5, 'Drill energy should keep regenerating continuously between uses');
assert.equal(state.charges, 1, 'energy from 20 inclusive to below 40 should display as one charge');
assert.equal(state.nextRecoveryTime, 232.5, 'Drill should next be full when energy recovers back to 40');
assert.deepEqual(state.recoveryEvents, [180, 200], 'Drill CD reminders should only mark full-energy moments');

state = chargeContext.simulateChargeState('drill', 232.5, [160, 180, 212.5], {});
assert.equal(state.energy, 40, 'Drill should be full at 232.5s');
assert.equal(state.charges, 2, '40 Drill energy should display as two charges');
assert.deepEqual(state.recoveryEvents, [180, 200, 232.5], 'full-energy reminders should include 232.5s under the energy model');

const transitionHarness = `
const DEFAULT_GCD_SECONDS = 2.5;
const actionsById = { heated: { gcdDuration: 2.5 } };
const plan = [{ gcd: 'heated', gapAfter: 10 }, { gcd: null, gapAfter: 0 }];
${extractFunction('getColumnGapAfter')}
${extractFunction('getColumnBaseDuration')}
${extractFunction('getCooldownDisplayColumnIndex')}
`;

const transitionContext = {};
Function('context', `with (context) { ${transitionHarness}; context.getCooldownDisplayColumnIndex = getCooldownDisplayColumnIndex; }`)(transitionContext);

assert.equal(
  transitionContext.getCooldownDisplayColumnIndex(176, 0, [175, 187.5]),
  0,
  'cooldowns before the transition gap should display in the source GCD column',
);
assert.equal(
  transitionContext.getCooldownDisplayColumnIndex(180, 0, [175, 187.5]),
  1,
  'cooldowns during a transition gap should display in the following column',
);

const robotHarness = `
${extractFunction('getRobotEventsFromFacts')}
`;

const robotContext = {};
Function('context', `with (context) { ${robotHarness}; context.getRobotEventsFromFacts = getRobotEventsFromFacts; }`)(robotContext);

assert.deepEqual(
  robotContext.getRobotEventsFromFacts({ useTimesByAction: new Map([['automaton-queen', [100]]]) }),
  [
    { actionId: 'arm-punch', time: 105.75 },
    { actionId: 'arm-punch', time: 107.25 },
    { actionId: 'arm-punch', time: 108.75 },
    { actionId: 'arm-punch', time: 110.25 },
    { actionId: 'arm-punch', time: 111.75 },
    { actionId: 'pile-bunker', time: 113.25 },
    { actionId: 'crowned-collider', time: 115.75 },
  ],
  'Automaton Queen should wait 5.75s, perform five Arm Punches, then Pile Bunker and Crowned Collider',
);

console.log('charge simulation regressions passed');
