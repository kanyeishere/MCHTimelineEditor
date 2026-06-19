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
const TIME_EPSILON = 1e-6;
const actionsById = { drill: { recast: 20, charges: 2 } };
function getReductionEventTimes() { return []; }
${extractFunction('getChargeRecoveryTime')}
${extractFunction('simulateChargeState')}
`;

const chargeContext = {};
Function('context', `with (context) { ${chargeHarness}; context.simulateChargeState = simulateChargeState; }`)(chargeContext);

let state = chargeContext.simulateChargeState('drill', 207.5, [160, 180], {});
assert.equal(state.charges, 1, 'a same-time 180s use should leave one Drill charge recovered by 207.5s');
assert.equal(state.nextRecoveryTime, 220, 'the second Drill charge should still recover at 220s');

state = chargeContext.simulateChargeState('drill', 215, [160, 180, 212.5], {});
assert.equal(state.charges, 0, 'using Drill at 212.5s should spend the only available charge before 220s');
assert.equal(state.nextRecoveryTime, 220, 'the next recovery after 212.5s should remain 220s');

state = chargeContext.simulateChargeState('drill', 220, [160, 180, 212.5], {});
assert.equal(state.charges, 1, 'Drill should have one charge at 220s');
assert.equal(state.nextRecoveryTime, 240, 'the following Drill charge should recover at 240s');
assert.deepEqual(
  state.recoveryEvents,
  [200, 220],
  'using Drill at 212.5s must not reset the already-running recovery toward 220s',
);

state = chargeContext.simulateChargeState('drill', 240, [160, 180, 212.5, 240], {});
assert.equal(state.charges, 1, 'using Drill exactly when the second charge recovers should leave one charge');
assert.equal(state.nextRecoveryTime, 260, 'spending one charge at 240s should start the next recovery toward 260s');

state = chargeContext.simulateChargeState('drill', 40, [0, 20, 40], {});
assert.equal(state.charges, 0, 'using Drill exactly as a charge recovers should display zero charges in that GCD');
assert.equal(state.nextRecoveryTime, 60, 'the consumed same-time recovery should push the next Drill charge to 60s');

state = chargeContext.simulateChargeState('drill', 57.5, [0, 20, 40], {});
assert.equal(state.charges, 0, 'Drill should remain at zero charges until the next recovery completes');
assert.equal(state.nextRecoveryTime, 60, 'the next recovery should still complete at 60s');

state = chargeContext.simulateChargeState('drill', 215, [160.0000001, 180.0000002, 212.5], {});
assert.equal(state.charges, 0, 'near-equal imported timestamps should be treated as same-time charge events');
assert.ok(Math.abs(state.nextRecoveryTime - 220.0000001) <= 1e-6, 'near-equal imported timestamps should preserve the 220s recovery');

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
