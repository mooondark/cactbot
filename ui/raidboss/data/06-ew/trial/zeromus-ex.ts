import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { PluginCombatantState } from '../../../../../types/event';
import { TriggerSet } from '../../../../../types/trigger';

// TODO: Abyssal Echoes safe spots
// TODO: Flare safe spots
// TODO: Meteor tether calls (could we say like 3 left, 1 right?)

export interface Data extends RaidbossData {
  phase: 'one' | 'two';
  seenSableThread?: boolean;
  miasmicBlasts: PluginCombatantState[];
  busterPlayers: string[];
  forkedPlayers: string[];
  bigBangStackPlayer?: string;
  blackHolePlayer?: string;
  flareMechanic?: 'spread' | 'stack';
  noxPlayers: string[];
  flowLocation?: 'north' | 'middle' | 'south';
}

const headmarkerMap = {
  tankBuster: '016C',
  blackHole: '014A',
  tether: '0146',
  // Most spread markers (Big Bang, Big Crunch, Dark Divides)
  spread: '0178',
  accelerationBomb: '010B',
  nox: '00C5',
  akhRhaiSpread: '0017',
  enums: '00D3',
  // The Dark Beckons, but also Umbral Rays
  stack: '003E',
} as const;

const centerX = 100;
const centerY = 100;

const triggerSet: TriggerSet<Data> = {
  id: 'TheAbyssalFractureExtreme',
  zoneId: ZoneId.TheAbyssalFractureExtreme,
  timelineFile: 'zeromus-ex.txt',
  initData: () => {
    return {
      phase: 'one',
      miasmicBlasts: [],
      busterPlayers: [],
      forkedPlayers: [],
      noxPlayers: [],
    };
  },
  timelineTriggers: [
    {
      id: 'ZeromusEx Flare',
      // Extra time for spreading out.
      // This could also be StartsUsing 85BD.
      regex: /^Flare$/,
      beforeSeconds: 13,
      suppressSeconds: 20,
      response: Responses.getTowers(),
    },
    {
      id: 'ZeromusEx Big Bang Spread',
      // Extra time for spreading out.
      // This could alternatively be StartsUsing 8B4C or HeadMarker 0178.
      regex: /^Big Bang$/,
      beforeSeconds: 13,
      suppressSeconds: 20,
      response: Responses.spread('alert'),
    },
    {
      id: 'ZeromusEx Big Crunch Spread',
      // Extra time for spreading out.
      // This could alternatively be StartsUsing 8B4D or HeadMarker 0178.
      regex: /^Big Crunch$/,
      beforeSeconds: 13,
      suppressSeconds: 20,
      response: Responses.spread('alert'),
    },
  ],
  triggers: [
    {
      id: 'ZeromusEx Abyssal Nox',
      type: 'GainsEffect',
      netRegex: { effectId: '6E9', capture: false },
      suppressSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Heal to full',
          de: 'Voll heilen',
          fr: 'Soin complet',
          ja: 'HPを満タンに',
          cn: '奶满全队',
          ko: '체력 풀피로',
        },
      },
    },
    {
      id: 'ZeromusEx Sable Thread',
      type: 'Ability',
      netRegex: { id: '8AEF', source: 'Zeromus' },
      alertText: (data, matches, output) => {
        const num = data.seenSableThread ? 7 : 6;
        data.seenSableThread = true;
        if (matches.target === data.me)
          return output.lineStackOnYou!({ num: num });
        return output.lineStackOn!({ num: num, player: data.party.member(matches.target) });
      },
      outputStrings: {
        lineStackOn: {
          en: '${num}x line stack on ${player}',
          de: '${num}x in einer Linie sammeln mit ${player}',
          fr: 'Package en ligne ${num}x sur ${player}',
          ja: '${num}x 直線頭割り (${player})',
          cn: '${num}x 直线分摊 (${player})',
          ko: '${num}x 직선 쉐어 (${player})',
        },
        lineStackOnYou: {
          en: '${num}x line stack on YOU',
          de: '${num}x in einer Linie sammeln mit DIR',
          fr: 'Package en ligne ${num}x sur VOUS',
          ja: '自分に${num}x 直線頭割り',
          cn: '${num}x 直线分摊点名',
          ko: '${num}x 직선 쉐어 대상자',
        },
      },
    },
    {
      id: 'ZeromusEx Dark Matter You',
      type: 'HeadMarker',
      netRegex: { id: headmarkerMap.tankBuster },
      alertText: (data, matches, output) => {
        data.busterPlayers.push(matches.target);
        if (data.me === matches.target)
          return output.tankBusterOnYou!();
      },
      outputStrings: {
        tankBusterOnYou: Outputs.tankBusterOnYou,
      },
    },
    {
      id: 'ZeromusEx Dark Matter Others',
      type: 'HeadMarker',
      netRegex: { id: headmarkerMap.tankBuster, capture: false },
      delaySeconds: 0.5,
      suppressSeconds: 2,
      infoText: (data, _matches, output) => {
        if (!data.busterPlayers.includes(data.me))
          return output.tankBusters!();
      },
      outputStrings: {
        tankBusters: Outputs.tankBusters,
      },
    },
    {
      id: 'ZeromusEx Dark Matter Cleanup',
      type: 'Ability',
      netRegex: { id: '8B84', source: 'Zeromus', capture: false },
      suppressSeconds: 5,
      run: (data) => data.busterPlayers = [],
    },
    {
      id: 'ZeromusEx Visceral Whirl NE Safe',
      type: 'StartsUsing',
      netRegex: { id: '8B43', source: 'Zeromus', capture: false },
      infoText: (_data, _matches, output) => {
        return output.text!({ dir1: output.ne!(), dir2: output.sw!() });
      },
      outputStrings: {
        text: {
          en: '${dir1} / ${dir2}',
          de: '${dir1} / ${dir2}',
          fr: '${dir1} / ${dir2}',
          ja: '${dir1} / ${dir2}',
          cn: '${dir1} / ${dir2}',
          ko: '${dir1} / ${dir2}',
        },
        ne: Outputs.northeast,
        sw: Outputs.southwest,
      },
    },
    {
      id: 'ZeromusEx Visceral Whirl NW Safe',
      type: 'StartsUsing',
      netRegex: { id: '8B46', source: 'Zeromus', capture: false },
      infoText: (_data, _matches, output) => {
        return output.text!({ dir1: output.nw!(), dir2: output.se!() });
      },
      outputStrings: {
        text: {
          en: '${dir1} / ${dir2}',
          de: '${dir1} / ${dir2}',
          fr: '${dir1} / ${dir2}',
          ja: '${dir1} / ${dir2}',
          cn: '${dir1} / ${dir2}',
          ko: '${dir1} / ${dir2}',
        },
        nw: Outputs.northwest,
        se: Outputs.southeast,
      },
    },
    {
      id: 'ZeromusEx Miasmic Blasts Reset',
      type: 'StartsUsing',
      // reset Blasts combatant data when the preceding Visceral Whirl is used
      netRegex: { id: '8B4[36]', source: 'Zeromus', capture: false },
      run: (data) => data.miasmicBlasts = [],
    },
    {
      id: 'ZeromusEx Miasmic Blast Safe Spots',
      type: 'StartsUsing',
      netRegex: { id: '8B49', source: 'Zeromus', capture: true },
      delaySeconds: 0.5,
      promise: async (data, matches) => {
        const combatants = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        })).combatants;

        if (combatants.length !== 1)
          return;

        const combatant = combatants[0];
        if (combatant === undefined)
          return;

        data.miasmicBlasts.push(combatant);
      },
      alertText: (data, _matches, output) => {
        if (data.miasmicBlasts.length !== 3) {
          return;
        }
        // Blasts can spawn center, on cardinals (+/-14 from center), or on intercards (+/-7 from center).
        // Unsafe spots vary for each of the 9 possible spawn points, but are always the same *relative* to that type.
        // So apply a fixed set of modifiers based on type, regardless of spawn point, to eliminate unsafe spots.
        const cardinal16Dirs = [0, 4, 8, 12];
        const intercard16Dirs = [2, 6, 10, 14];
        const unsafe16DirModifiers = {
          cardinal: [-1, 0, 1, 4, 5, 11, 12],
          intercard: [-2, 0, 2, 3, 8, 13],
        };

        // Filter to north half.
        const validSafeSpots = [
          'dirNNE',
          'dirNE',
          'dirENE',
          'dirWNW',
          'dirNW',
          'dirNNW',
        ] as const;
        let possibleSafeSpots = [...validSafeSpots];

        for (const blast of data.miasmicBlasts) {
          // special case for center - don't need to find relative dirs, just remove all intercards
          if (Math.round(blast.PosX) === 100 && Math.round(blast.PosY) === 100)
            intercard16Dirs.forEach((intercard) =>
              possibleSafeSpots = possibleSafeSpots.filter((dir) =>
                dir !== Directions.output16Dir[intercard]
              )
            );
          else {
            const blastPos16Dir = Directions.xyTo16DirNum(blast.PosX, blast.PosY, centerX, centerY);
            const relativeUnsafeDirs = cardinal16Dirs.includes(blastPos16Dir)
              ? unsafe16DirModifiers.cardinal
              : unsafe16DirModifiers.intercard;
            for (const relativeUnsafeDir of relativeUnsafeDirs) {
              const actualUnsafeDir = (16 + blastPos16Dir + relativeUnsafeDir) % 16;
              possibleSafeSpots = possibleSafeSpots.filter((dir) =>
                dir !== Directions.output16Dir[actualUnsafeDir]
              );
            }
          }
        }

        if (possibleSafeSpots.length !== 1)
          return output.avoidUnknown!();

        const [safeDir] = possibleSafeSpots;
        if (safeDir === undefined)
          return output.avoidUnknown!();

        return output[safeDir]!();
      },
      outputStrings: {
        avoidUnknown: {
          en: 'Avoid Line Cleaves',
          de: 'Weiche den Linien Cleaves aus',
          fr: 'Évitez les cleaves en ligne',
          ja: '直線AOE回避',
          cn: '远离十字AOE',
          ko: '직선 장판 피하기',
        },
        dirNNE: {
          en: 'North Wall (NNE/WSW)',
          de: 'Nördliche Wand (NNO/WSW)',
          fr: 'Mur Nord (NNE/OSO)',
          ja: '1時・8時',
          cn: '右上前方/左下侧边',
          ko: '1시/8시',
        },
        dirNNW: {
          en: 'North Wall (NNW/ESE)',
          de: 'Nördliche Wand (NNW/OSO)',
          fr: 'Mur Nord (NNO/ESE)',
          ja: '11時・4時',
          cn: '左上前方/右下侧边',
          ko: '11시/4시',
        },
        dirNE: {
          en: 'Corners (NE/SW)',
          de: 'Ecken (NO/SW)',
          fr: 'Coins (NE/SO)',
          ja: '隅へ (北東・南西)',
          cn: '右上/左下角落',
          ko: '구석 (북동/남서)',
        },
        dirNW: {
          en: 'Corners (NW/SE)',
          de: 'Ecken (NW/SO)',
          fr: 'Coins (NO/SE)',
          ja: '隅へ (北西・南東)',
          cn: '左上/右下角落',
          ko: '구석 (북서/남동)',
        },
        dirENE: {
          en: 'East Wall (ENE/SSW)',
          de: 'Östliche Wand (ONO/SSW)',
          fr: 'Mur Est (ENE/SSO)',
          ja: '2時・7時',
          cn: '右上侧边/左下后方',
          ko: '2시/7시',
        },
        dirWNW: {
          en: 'West Wall (WNW/SSE)',
          de: 'Westliche Wand (WNW/SSO)',
          fr: 'Mur Ouest (ONO/SSE)',
          ja: '10時・5時',
          cn: '左上侧边/右下后方',
          ko: '10시/5시',
        },
      },
    },
    {
      id: 'ZeromusEx Big Bang',
      type: 'StartsUsing',
      netRegex: { id: '8B4C', source: 'Zeromus', capture: false },
      response: Responses.bleedAoe(),
    },
    {
      id: 'ZeromusEx Forked Lightning',
      type: 'GainsEffect',
      netRegex: { effectId: 'ED7' },
      condition: (data, matches) => {
        data.forkedPlayers.push(matches.target);
        return matches.target === data.me;
      },
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 6,
      durationSeconds: 5,
      alarmText: (_data, _matches, output) => output.forkedLightning!(),
      outputStrings: {
        forkedLightning: {
          en: 'Spread (forked lightning)',
          de: 'Verteilen (Gabelblitz)',
          fr: 'Écartez-vous (Éclair ramifié)',
          ja: '散会 (自分にAOE)',
          cn: '分散（闪电点名）',
          ko: '산개',
        },
      },
    },
    {
      id: 'ZeromusEx The Dark Beckons Stack Collect',
      type: 'HeadMarker',
      netRegex: { id: headmarkerMap.stack },
      condition: (data) => data.phase === 'one',
      run: (data, matches) => data.bigBangStackPlayer = matches.target,
    },
    {
      id: 'ZeromusEx The Dark Beckons Stack',
      type: 'HeadMarker',
      netRegex: { id: [headmarkerMap.stack, headmarkerMap.tankBuster] },
      condition: (data) => {
        if (data.phase !== 'one')
          return false;
        return data.bigBangStackPlayer !== undefined;
      },
      // If we have both busters, run immediately otherwise wait a reasonable amount of time
      // for them to show up.
      delaySeconds: (data) => data.busterPlayers.length === 2 ? 0 : 1,
      suppressSeconds: 10,
      alertText: (data, matches, output) => {
        if (data.busterPlayers.includes(data.me))
          return;
        if (data.forkedPlayers.includes(data.me))
          return;
        if (data.me === matches.target)
          return output.stackOnYou!();
        return output.stackOnTarget!({ player: data.party.member(matches.target) });
      },
      outputStrings: {
        stackOnYou: Outputs.stackOnYou,
        stackOnTarget: Outputs.stackOnPlayer,
      },
    },
    {
      id: 'ZeromusEx Acceleration Bomb',
      type: 'GainsEffect',
      netRegex: { effectId: 'A61' },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 3,
      response: Responses.stopEverything(),
    },
    {
      id: 'ZeromusEx Tether Bait',
      type: 'HeadMarker',
      netRegex: { id: headmarkerMap.tether, capture: false },
      suppressSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Group middle for tethers',
          de: 'Gruppe in die Mitte für Verbindungen',
          fr: 'Groupe au centre pour les liens',
          ja: '真ん中で線連結を待つ',
          cn: '集合等待连线',
          ko: '중앙에 모여서 사슬 연결 기다리기',
        },
      },
    },
    {
      id: 'ZeromusEx Tether',
      type: 'Tether',
      netRegex: { id: ['00A3', '010B'] },
      condition: (data, matches) => data.me === matches.target || data.me === matches.source,
      suppressSeconds: 10,
      alertText: (data, matches, output) => {
        const partner = matches.source === data.me ? matches.target : matches.source;
        return output.breakTether!({ partner: data.party.member(partner) });
      },
      outputStrings: {
        breakTether: {
          en: 'Break tether (w/ ${partner})',
          de: 'Verbindung brechen (mit ${partner})',
          fr: 'Cassez le lien (avec ${partner})',
          ja: '線切る (${partner})',
          cn: '拉断连线 (和 ${partner})',
          ko: '선 끊기 (+ ${partner})',
        },
      },
    },
    {
      id: 'ZeromusEx Black Hole Tracker',
      type: 'HeadMarker',
      netRegex: { id: headmarkerMap.blackHole },
      run: (data, matches) => data.blackHolePlayer = matches.target,
    },
    {
      id: 'ZeromusEx Fractured Eventide NE Safe',
      type: 'StartsUsing',
      netRegex: { id: '8B3C', source: 'Zeromus', capture: false },
      alarmText: (data, _matches, output) => {
        if (data.me === data.blackHolePlayer)
          return output.blackHole!();
      },
      alertText: (_data, _matches, output) => output.northeast!(),
      run: (data) => delete data.blackHolePlayer,
      outputStrings: {
        northeast: Outputs.northeast,
        blackHole: {
          en: 'East Black Hole on Wall',
          de: 'Schwarzes Loch an die östliche Wand',
          fr: 'Trou noir Est sur Mur',
          ja: '右にブラックホール',
          cn: '右上放置黑洞',
          ko: '오른쪽 구석에 블랙홀 놓기',
        },
      },
    },
    {
      id: 'ZeromusEx Fractured Eventide NW Safe',
      type: 'StartsUsing',
      netRegex: { id: '8B3D', source: 'Zeromus', capture: false },
      alarmText: (data, _matches, output) => {
        if (data.me === data.blackHolePlayer)
          return output.blackHole!();
      },
      alertText: (_data, _matches, output) => output.northwest!(),
      run: (data) => delete data.blackHolePlayer,
      outputStrings: {
        northwest: Outputs.northwest,
        blackHole: {
          en: 'West Black Hole on Wall',
          de: 'Schwarzes Loch an die westliche Wand',
          fr: 'Trou noir Ouest sur Mur',
          ja: '左にブラックホール',
          cn: '左上放置黑洞',
          ko: '왼쪽 구석에 블랙홀 놓기',
        },
      },
    },
    {
      id: 'ZeromusEx Big Crunch',
      type: 'StartsUsing',
      netRegex: { id: '8B4D', source: 'Zeromus', capture: false },
      response: Responses.bleedAoe(),
    },
    {
      id: 'ZeromusEx Sparking Flare Tower',
      type: 'StartsUsing',
      netRegex: { id: '8B5E', source: 'Zeromus', capture: false },
      durationSeconds: 6,
      alertText: (_data, _matches, output) => output.text!(),
      run: (data) => data.flareMechanic = 'spread',
      outputStrings: {
        text: {
          en: 'Get Towers => Spread',
          de: 'Türme nehmen => Verteilen',
          fr: 'Prenez les tours -> Écartez-vous',
          ja: '塔踏み => 散会',
          cn: '踩塔 => 分散',
          ko: '기둥 밟기 => 산개',
        },
      },
    },
    {
      id: 'ZeromusEx Branding Flare Tower',
      type: 'StartsUsing',
      netRegex: { id: '8B5F', source: 'Zeromus', capture: false },
      durationSeconds: 6,
      alertText: (_data, _matches, output) => output.text!(),
      run: (data) => data.flareMechanic = 'stack',
      outputStrings: {
        text: {
          en: 'Get Towers => Partner Stacks',
          de: 'Türme nehmen => mit Partner sammeln',
          fr: 'Prenez les tours -> Partenaires',
          ja: '塔踏み => ペア',
          cn: '踩塔 => 分摊',
          ko: '기둥 밟기 => 2인 쉐어',
        },
      },
    },
    {
      id: 'ZeromusEx Flare Mechanic With Nox',
      type: 'HeadMarker',
      netRegex: { id: headmarkerMap.nox },
      condition: (data, matches) => {
        data.noxPlayers.push(matches.target);
        return data.me === matches.target;
      },
      alarmText: (data, _matches, output) => {
        if (data.flareMechanic === 'stack')
          return output.stackWithNox!();
        if (data.flareMechanic === 'spread')
          return output.spreadWithNox!();
      },
      outputStrings: {
        stackWithNox: {
          en: 'Partner Stack + Chasing Nox',
          de: 'Mit Partner Sammeln + verfolgendes Nox',
          fr: 'Package partenaires + Nox',
          ja: 'ペア + ついてくるAOE',
          cn: '分摊 + 步进点名',
          ko: '2인 쉐어 + 따라오는 장판',
        },
        spreadWithNox: {
          en: 'Spread + Chasing Nox',
          de: 'Verteilen + verfolgendes Nox',
          fr: 'Écartez-vous + Nox',
          ja: '散会 + ついてくるAOE',
          cn: '分散 + 步进点名',
          ko: '산개 + 따라오는 장판',
        },
      },
    },
    {
      id: 'ZeromusEx Flare Mechanic No Nox',
      type: 'HeadMarker',
      netRegex: { id: headmarkerMap.nox, capture: false },
      delaySeconds: (data) => data.noxPlayers.length === 2 ? 0 : 0.5,
      suppressSeconds: 5,
      alertText: (data, _matches, output) => {
        if (data.noxPlayers.includes(data.me))
          return;
        if (data.flareMechanic === 'stack')
          return output.stack!();
        if (data.flareMechanic === 'spread')
          return output.spread!();
      },
      outputStrings: {
        stack: {
          en: 'Partner Stack',
          de: 'mit Partner sammeln',
          fr: 'Package avec partenaire',
          ja: 'ペア',
          cn: '分摊',
          ko: '2인 쉐어',
        },
        spread: {
          en: 'Spread',
          de: 'Verteilen',
          fr: 'Écartez-vous',
          ja: '散会',
          cn: '分散',
          ko: '산개',
        },
      },
    },
    {
      id: 'ZeromusEx Rend the Rift',
      type: 'StartsUsing',
      netRegex: { id: '8C0D', source: 'Zeromus', capture: false },
      response: Responses.aoe(),
      run: (data) => data.phase = 'two',
    },
    {
      id: 'ZeromusEx Nostalgia',
      type: 'Ability',
      // Call this on the ability not the cast so 10 second mits last.
      netRegex: { id: '8B6B', source: 'Zeromus', capture: false },
      suppressSeconds: 5,
      response: Responses.bigAoe(),
    },
    {
      id: 'ZeromusEx Flow of the Abyss',
      type: 'MapEffect',
      netRegex: { flags: '00020001', location: ['02', '03', '04'] },
      infoText: (data, matches, output) => {
        const flowMap: { [location: string]: Data['flowLocation'] } = {
          '02': 'north',
          '03': 'middle',
          '04': 'south',
        } as const;

        data.flowLocation = flowMap[matches.location];
        if (data.flowLocation === 'north')
          return output.north!();
        if (data.flowLocation === 'middle')
          return output.middle!();
        if (data.flowLocation === 'south')
          return output.south!();
      },
      outputStrings: {
        north: {
          en: 'Out of North',
          de: 'Weg vom Norden',
          fr: 'En dehors du Nord',
          ja: '北危険',
          cn: '远离上半场',
          ko: '북쪽 피하기',
        },
        middle: {
          en: 'Out of Middle',
          de: 'Weg von der Mitte',
          fr: 'En dehors du milieu',
          ja: '中央危険',
          cn: '远离中间',
          ko: '중앙 피하기',
        },
        south: {
          en: 'Out of South',
          de: 'Weg vom Süden',
          fr: 'En dehors du Sud',
          ja: '南危険',
          cn: '远离下半场',
          ko: '남쪽 피하기',
        },
      },
    },
    {
      id: 'ZeromusEx Akh Rhai',
      type: 'HeadMarker',
      netRegex: { id: headmarkerMap.akhRhaiSpread },
      condition: Conditions.targetIsYou(),
      alertText: (data, _matches, output) => {
        if (data.flowLocation === undefined)
          return output.spread!();
        return output[`${data.flowLocation}Spread`]!();
      },
      run: (data) => delete data.flowLocation,
      outputStrings: {
        spread: Outputs.spread,
        northSpread: {
          en: 'Spread Middle/South',
          de: 'Verteilen Mitte/Süden',
          fr: 'Écartez-vous Milieu/Sud',
          ja: '中央・南で散会',
          cn: '中间/下半场 分散',
          ko: '중앙/남쪽으로 산개',
        },
        middleSpread: {
          en: 'Spread North/South',
          de: 'Verteilen Norden/Süden',
          fr: 'Écartez-vous Nord/Sud',
          ja: '北・南で散会',
          cn: '上/下两侧 分散',
          ko: '북쪽/남쪽으로 산개',
        },
        southSpread: {
          en: 'Spread North/Middle',
          de: 'Verteilen Norden/Mitte',
          fr: 'Écartez-vous Nord/Milieu',
          ja: '北・中央で散会',
          cn: '上半场/中间 分散',
          ko: '북쪽/중앙으로 산개',
        },
      },
    },
    {
      id: 'ZeromusEx Akh Rhai Followup',
      type: 'Ability',
      netRegex: { id: '8B74', source: 'Zeromus', capture: false },
      suppressSeconds: 5,
      response: Responses.moveAway(),
    },
    {
      id: 'ZeromusEx Umbral Prism Enumeration',
      type: 'HeadMarker',
      netRegex: { id: headmarkerMap.enums, capture: false },
      suppressSeconds: 2,
      alertText: (data, _matches, output) => {
        if (data.flowLocation === undefined)
          return output.enumeration!();
        return output[`${data.flowLocation}Enumeration`]!();
      },
      run: (data) => delete data.flowLocation,
      outputStrings: {
        enumeration: {
          en: 'Enumeration',
          de: 'Enumeration',
          fr: 'Énumération',
          ja: 'エアーバンプ',
          cn: '蓝圈分摊',
          ko: '2인 장판',
        },
        northEnumeration: {
          en: 'Enumeration Middle/South',
          de: 'Enumeration Mitte/Süden',
          fr: 'Énumération Milieu/Sud',
          ja: '中央・南でエアーバンプ',
          cn: '中间/下半场 蓝圈分摊',
          ko: '2인 장판 중앙/남쪽',
        },
        middleEnumeration: {
          en: 'Enumeration North/South',
          de: 'Enumeration Norden/Süden',
          fr: 'Énumération Nord/Sud',
          ja: '北・南でエアーバンプ',
          cn: '上/下两侧 蓝圈分摊',
          ko: '2인 장판 북쪽/남쪽',
        },
        southEnumeration: {
          en: 'Enumeration North/Middle',
          de: 'Enumeration Norden/Mitte',
          fr: 'Énumération Nord/Milieu',
          ja: '北・中央でエアーバンプ',
          cn: '上半场/中间 蓝圈分摊',
          ko: '2인 장판 북쪽/중앙',
        },
      },
    },
    {
      id: 'ZeromusEx Umbral Rays Stack',
      type: 'HeadMarker',
      netRegex: { id: headmarkerMap.stack, capture: false },
      condition: (data) => data.phase === 'two',
      alertText: (data, _matches, output) => {
        if (data.flowLocation === undefined)
          return output.stack!();
        return output[`${data.flowLocation}Stack`]!();
      },
      run: (data) => delete data.flowLocation,
      outputStrings: {
        stack: Outputs.stackMarker,
        northStack: {
          en: 'Stack Middle',
          de: 'Mittig sammeln',
          fr: 'Packez-vous au milieu',
          ja: '中央で頭割り',
          cn: '中间分摊',
          ko: '중앙에서 쉐어',
        },
        middleStack: {
          en: 'Stack North',
          de: 'Nördlich sammeln',
          fr: 'Packez-vous au Nord',
          ja: '北で頭割り',
          cn: '上半场分摊',
          ko: '북쪽에서 쉐어',
        },
        southStack: {
          en: 'Stack North/Middle',
          de: 'Nördlich/Mittig sammeln',
          fr: 'Packez-vous au Nord/milieu',
          ja: '北・中央で頭割り',
          cn: '上半场/中间 分摊',
          ko: '북쪽/중앙에서 쉐어',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Branding Flare/Sparking Flare': 'Branding/Sparking Flare',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        'Comet': 'Komet',
        'Toxic Bubble': 'Giftblase',
        'Zeromus': 'Zeromus',
      },
      'replaceText': {
        '--spread--': '--verteilen--',
        '--towers--': '--Türme--',
        'Abyssal Echoes': 'Abyssal-Echos',
        'Abyssal Nox': 'Abyssal-Nox',
        'Akh Rhai': 'Akh Rhai',
        'Big Bang': 'Großer Knall',
        'Big Crunch': 'Großer Quetscher',
        'Black Hole': 'Schwarzes Loch',
        'Branding Flare': 'Flare-Brand',
        'Burst': 'Kosmos-Splitter',
        'Bury': 'Impakt',
        'Chasmic Nails': 'Abyssal-Nagel',
        'Dark Matter': 'Dunkelmaterie',
        'Dimensional Surge': 'Dimensionsschwall',
        'Explosion': 'Explosion',
        '(?<! )Flare': 'Flare',
        'Flow of the Abyss': 'Abyssaler Strom',
        'Forked Lightning': 'Gabelblitz',
        'Fractured Eventide': 'Abendglut',
        'Meteor Impact': 'Meteoreinschlag',
        'Miasmic Blast': 'Miasma-Detonation',
        'Nostalgia': 'Heimweh',
        'Primal Roar': 'Lautes Gebrüll',
        'Prominence Spine': 'Ossale Protuberanz',
        'Rend the Rift': 'Dimensionsstörung',
        '(?<! )Roar': 'Brüllen',
        'Sable Thread': 'Pechschwarzer Pfad',
        'Sparking Flare': 'Flare-Funken',
        'The Dark Beckons': 'Fressende Finsternis: Last',
        'The Dark Divides': 'Fressende Finsternis: Zerschmetterung',
        'Umbral Prism': 'Umbrales Prisma',
        'Umbral Rays': 'Pfad der Dunkelheit',
        'Visceral Whirl': 'Viszerale Schürfwunden',
        'Void Bio': 'Nichts-Bio',
        'Void Meteor': 'Nichts-Meteo',
        'the Dark Beckons': 'Fressende Finsternis: Last',
        'the Dark Binds': 'Fressende Finsternis: Kette',
        'the Dark Divides': 'Fressende Finsternis: Zerschmetterung',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Comet': 'comète',
        'Toxic Bubble': 'bulle empoisonnée',
        'Zeromus': 'Zeromus',
      },
      'replaceText': {
        '--spread--': '--Écartement--',
        '--towers--': '--Tours--',
        'Abyssal Echoes': 'Écho abyssal',
        'Abyssal Nox': 'Nox abyssal',
        'Akh Rhai': 'Akh Rhai',
        'Big Bang': 'Big bang',
        'Big Crunch': 'Big crunch',
        'Black Hole': 'Trou noir',
        'Branding Flare': 'Marque de brasier',
        'Burst': 'Éclatement',
        'Bury': 'Impact',
        'Chasmic Nails': 'Clous abyssaux',
        'Dark Matter': 'Matière sombre',
        'Dimensional Surge': 'Déferlante dimensionnelle',
        'Explosion': 'Explosion',
        '(?<! )Flare': 'Brasier',
        'Flow of the Abyss': 'Flot abyssal',
        'Forked Lightning': 'Éclair ramifié',
        'Fractured Eventide': 'Éclat crépusculaire',
        'Meteor Impact': 'Impact de météore',
        'Miasmic Blast': 'Explosion miasmatique',
        'Nostalgia': 'Nostalgie',
        'Primal Roar': 'Rugissement furieux',
        'Prominence Spine': 'Évidence ossuaire',
        'Rend the Rift': 'Déchirure dimensionnelle',
        '(?<! )Roar': 'Rugissement',
        'Sable Thread': 'Rayon sombre',
        'Sparking Flare': 'Étincelle de brasier',
        'The Dark Beckons': 'Ténèbres rongeuses : Gravité',
        'The Dark Divides': 'Ténèbres rongeuses : Pulvérisation',
        'Umbral Prism': 'Déluge de Ténèbres',
        'Umbral Rays': 'Voie de ténèbres',
        'Visceral Whirl': 'Écorchure viscérale',
        'Void Bio': 'Bactéries du néant',
        'Void Meteor': 'Météores du néant',
        'the Dark Beckons': 'Ténèbres rongeuses : Gravité',
        'the Dark Binds': 'Ténèbres rongeuses : Chaînes',
        'the Dark Divides': 'Ténèbres rongeuses : Pulvérisation',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Comet': 'コメット',
        'Toxic Bubble': 'ポイズナスバブル',
        'Zeromus': 'ゼロムス',
      },
      'replaceText': {
        '--spread--': '--散会--',
        '--towers--': '--塔--',
        'Abyssal Echoes': 'アビサルエコー',
        'Abyssal Nox': 'アビサルノックス',
        'Akh Rhai': 'アク・ラーイ',
        'Big Bang': 'ビッグバーン',
        'Big Crunch': 'ビッグクランチ',
        'Black Hole': 'ブラックホール',
        'Branding Flare': 'フレアブランド',
        'Burst': '飛散',
        'Bury': '衝撃',
        'Chasmic Nails': 'アビサルネイル',
        'Dark Matter': 'ダークマター',
        'Dimensional Surge': 'ディメンションサージ',
        'Explosion': '爆発',
        '(?<! )Flare': 'フレア',
        'Flow of the Abyss': 'アビサルフロウ',
        'Forked Lightning': 'フォークライトニング',
        'Fractured Eventide': '黒竜閃',
        'Meteor Impact': 'メテオインパクト',
        'Miasmic Blast': '瘴気爆発',
        'Nostalgia': '望郷',
        'Primal Roar': '大咆哮',
        'Prominence Spine': 'プロミネンススパイン',
        'Rend the Rift': '次元干渉',
        '(?<! )Roar': '咆哮',
        'Sable Thread': '漆黒の熱線',
        'Sparking Flare': 'フレアスパーク',
        'The Dark Beckons': '闇の侵食：重',
        'The Dark Divides': '闇の侵食：砕',
        'Umbral Prism': '闇の重波動',
        'Umbral Rays': '闇の波動',
        'Visceral Whirl': 'ヴィセラルワール',
        'Void Bio': 'ヴォイド・バイオ',
        'Void Meteor': 'ヴォイド・メテオ',
        'the Dark Beckons': '闇の侵食：重',
        'the Dark Binds': '闇の侵食：鎖',
        'the Dark Divides': '闇の侵食：砕',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Comet': '彗星',
        'Toxic Bubble': '有毒气泡',
        'Zeromus': '泽罗姆斯',
      },
      'replaceText': {
        '--spread--': '--分散--',
        '--towers--': '--塔--',
        'Abyssal Echoes': '深渊回声',
        'Abyssal Nox': '深渊之夜',
        'Akh Rhai': '天光轮回',
        'Big Bang': '宇宙大爆炸',
        'Big Crunch': '宇宙大挤压',
        'Black Hole': '黑洞',
        'Branding Flare': '核爆火印',
        'Burst': '飞散',
        'Bury': '塌方',
        'Chasmic Nails': '深渊连爪',
        'Dark Matter': '暗物质',
        'Dimensional Surge': '次元涌动',
        'Explosion': '爆炸',
        '(?<! )Flare': '核爆',
        'Flow of the Abyss': '深渊激流',
        'Forked Lightning': '叉形闪电',
        'Fractured Eventide': '黑龙闪',
        'Meteor Impact': '陨石冲击',
        'Miasmic Blast': '瘴气爆发',
        'Nostalgia': '望乡',
        'Primal Roar': '大咆哮',
        'Prominence Spine': '日珥焰棘',
        'Rend the Rift': '次元干涉',
        '(?<! )Roar': '咆哮',
        'Sable Thread': '漆黑射线',
        'Sparking Flare': '核爆火花',
        'The Dark Beckons': '黑暗侵蚀：重击',
        'The Dark Divides': '黑暗侵蚀：飞散',
        'Umbral Prism': '暗之重波动',
        'Umbral Rays': '暗之波动',
        'Visceral Whirl': '旋骨利爪',
        'Void Bio': '虚空毒菌',
        'Void Meteor': '虚空陨石',
        'the Dark Beckons': '黑暗侵蚀：重击',
        'the Dark Binds': '黑暗侵蚀：锁链',
        'the Dark Divides': '黑暗侵蚀：飞散',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Comet': '혜성',
        'Toxic Bubble': '독성 거품',
        'Zeromus': '제로무스',
      },
      'replaceText': {
        '--spread--': '--산개--',
        '--towers--': '--기둥--',
        'Abyssal Echoes': '심연의 메아리',
        'Abyssal Nox': '심연의 암야',
        'Akh Rhai': '아크 라이',
        'Big Bang': '빅뱅',
        'Big Crunch': '빅 크런치',
        'Black Hole': '블랙홀',
        'Branding Flare': '플레어 횃불',
        'Burst': '산산조각',
        'Bury': '충격',
        'Chasmic Nails': '심연의 손톱',
        'Dark Matter': '암흑물질',
        'Dimensional Surge': '차원 쇄도',
        'Explosion': '폭발',
        '(?<! )Flare': '플레어',
        'Flow of the Abyss': '심연의 흐름',
        'Forked Lightning': '갈래 번개',
        'Fractured Eventide': '흑룡섬',
        'Meteor Impact': '운석 낙하',
        'Miasmic Blast': '독기 폭발',
        'Nostalgia': '망향',
        'Primal Roar': '대포효',
        'Prominence Spine': '홍염의 가시',
        'Rend the Rift': '차원 간섭',
        '(?<! )Roar': '포효',
        'Sable Thread': '칠흑의 열선',
        'Sparking Flare': '플레어 불꽃',
        'The Dark Beckons': '어둠의 침식: 집중',
        'The Dark Divides': '어둠의 침식: 분산',
        'Umbral Prism': '어둠의 겹파동',
        'Umbral Rays': '어둠의 파동',
        'Visceral Whirl': '본능의 상흔',
        'Void Bio': '보이드 바이오',
        'Void Meteor': '보이드 메테오',
        'the Dark Beckons': '어둠의 침식: 집중',
        'the Dark Binds': '어둠의 침식: 사슬',
        'the Dark Divides': '어둠의 침식: 분산',
      },
    },
  ],
};

export default triggerSet;
