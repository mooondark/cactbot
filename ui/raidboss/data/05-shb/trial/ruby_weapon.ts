import Conditions from '../../../../../resources/conditions';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  colors?: { [name: string]: string };
}

const triggerSet: TriggerSet<Data> = {
  id: 'CinderDrift',
  zoneId: ZoneId.CinderDrift,
  timelineFile: 'ruby_weapon.txt',
  timelineTriggers: [
    {
      id: 'Ruby Magitek Meteor Behind',
      regex: /Magitek Meteor/,
      beforeSeconds: 4,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Hide Behind Meteor',
          de: 'Hinter Meteor verstecken',
          fr: 'Cachez-vous derrière le météore',
          ja: 'コメットの後ろへ',
          cn: '躲在陨石后',
          ko: '운석 뒤에 숨기',
        },
      },
    },
    {
      id: 'Ruby Magitek Meteor Away',
      regex: /Burst/,
      beforeSeconds: 1,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Away From Meteor',
          de: 'Weg vom Meteor',
          fr: 'Éloignez-vous du météore',
          ja: 'コメットから離れる',
          cn: '远离陨石',
          ko: '운석에게서 멀어지기',
        },
      },
    },
  ],
  triggers: [
    {
      id: 'Ruby Optimized Ultima',
      type: 'StartsUsing',
      netRegex: { source: 'The Ruby Weapon', id: '4AA8', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Ruby Stamp',
      type: 'StartsUsing',
      netRegex: { source: 'The Ruby Weapon', id: '4AC7' },
      response: Responses.tankBuster(),
    },
    {
      id: 'Ruby Undermine',
      type: 'StartsUsing',
      netRegex: { source: 'The Ruby Weapon', id: '4A97', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Away from Lines',
          de: 'Weg von den Linien',
          fr: 'Éloignez-vous des sillons',
          ja: '線から離れる',
          cn: '远离线',
          ko: '선 피하기',
        },
      },
    },
    {
      id: 'Ruby Liquefaction',
      type: 'StartsUsing',
      netRegex: { source: 'The Ruby Weapon', id: '4A96', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Get On Lines',
          de: 'Auf die Linien gehen',
          fr: 'Allez sur les sillons',
          ja: '線の上へ',
          cn: '踩在线上',
          ko: '선 위로 올라가기',
        },
      },
    },
    {
      id: 'Ruby Ruby Ray',
      type: 'StartsUsing',
      netRegex: { source: 'The Ruby Weapon', id: '4AC6', capture: false },
      response: Responses.awayFromFront(),
    },
    {
      id: 'Ruby High-Powered Homing Lasers You',
      type: 'StartsUsing',
      netRegex: { source: 'The Ruby Weapon', id: '4AC5' },
      condition: Conditions.targetIsYou(),
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'Ruby High-Powered Homing Lasers',
      type: 'StartsUsing',
      netRegex: { source: 'The Ruby Weapon', id: '4AC5' },
      condition: Conditions.targetIsNotYou(),
      suppressSeconds: 1,
      response: Responses.stackMarker('info'),
    },
    {
      id: 'Ruby Dynamics',
      type: 'StartsUsing',
      netRegex: { source: 'The Ruby Weapon', id: '4AA0', capture: false },
      response: Responses.getUnder(),
    },
    {
      id: 'Ruby Homing Laser',
      type: 'HeadMarker',
      netRegex: { id: '008B' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      // Enrage can start casting before Ruby Weapon has finished their rotation
      // Give a friendly reminder to pop LB3 if you haven't already
      id: 'Ruby Optimized Ultima Enrage',
      type: 'StartsUsing',
      netRegex: { source: 'The Ruby Weapon', id: '4AA9', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Enrage!',
          de: 'Finalangriff!',
          fr: 'Enrage !',
          ja: '時間切れ！',
          cn: '狂暴',
          ko: '전멸기!',
        },
      },
    },
    {
      id: 'Ruby Meteor Stream',
      type: 'HeadMarker',
      netRegex: { id: '00E0' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'Ruby Ruby Claw',
      type: 'StartsUsing',
      netRegex: { source: 'Raven\'s Image', id: '4ABF' },
      condition: (data, matches) => {
        if (data.role === 'dps' && data.job !== 'BLU')
          return false;
        const myColor = data.colors?.[data.me];
        return myColor !== undefined && myColor === data.colors?.[matches.target];
      },
      suppressSeconds: 1,
      response: Responses.tankBuster(),
    },
    {
      id: 'Ruby Bradamante',
      type: 'HeadMarker',
      netRegex: { id: '0017' },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Avoid meteors with laser',
          de: 'Meteore mit Laser vermeiden',
          fr: 'Évitez les météores avec votre laser',
          ja: 'レザーを避ける',
          cn: '避开陨石方向引导激光',
          ko: '레이저 대상자 - 탱커 피하기',
        },
      },
    },
    {
      id: 'Ruby Outrage',
      type: 'StartsUsing',
      netRegex: { source: 'The Ruby Weapon', id: '4AC8', capture: false },
      response: Responses.aoe(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'The Ruby Weapon': 'Rubin-Waffe',
        'Raven\'s Image': 'Naels Trugbild',
        'Comet': 'Komet',
      },
      'replaceText': {
        'Undermine': 'Untergraben',
        'Stamp': 'Zerstampfen',
        'Spike Of Flame': 'Flammenstachel',
        'Ruby Ray': 'Rubin-Strahl',
        'Ruby Dynamics': 'Rubin-Dynamo',
        'Ravensflight': 'Flug des Raben',
        'Ravensclaw': 'Rabenklauen',
        'Optimized Ultima': 'Ultima-System',
        'Mark II Magitek Comet': 'Magitek-Komet Stufe II',
        'Magitek Meteor': 'Magitek-Meteor',
        '(?<! )Magitek Comet': 'Magitek-Komet',
        'Liquefaction': 'Verflüssigen',
        '(?<! )Homing Lasers': 'Leitlaser',
        'High-Powered Homing Lasers': 'Hochenergie-Leitlaser',
        'Helicoclaw': 'Spiralklauen',
        'Flexiclaw': 'Flex-Klauen',
        'Meteor Project': 'Projekt Meteor',
        'Negative Personae': 'Persona Negativa',
        'Meteor Stream': 'Meteorflug',
        'Ruby Claw': 'Rubin-Klauen',
        'Dalamud Impact': 'Dalamud-Sturz',
        'Outrage': 'Empörung',
        'Landing': 'Einschlag',
        'Burst': 'Explosion',
        'Bradamante': 'Bradamante',
        '--cutscene--': '--Zwischensequenz--',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Comet': 'Comète',
        'Raven\'s Image': 'Spectre De Nael',
        'The Ruby Weapon': 'Arme Rubis',
      },
      'replaceText': {
        '\\?': ' ?',
        '--cutscene--': '--cinématique--',
        'Undermine': 'Griffe souterraine',
        'Stamp': 'Piétinement sévère',
        'Spike Of Flame': 'Explosion de feu',
        'Ruby Ray': 'Rayon rubis',
        'Ruby Dynamics': 'Générateur rubis',
        'Ruby Claw': 'Griffe rubis',
        'Ravensflight': 'Vol du rapace',
        'Ravensclaw': 'Griffes du rapace',
        'Outrage': 'Indignation',
        'Optimized Ultima': 'Ultima magitek',
        'Negative Personae': 'Ipséité négative',
        'Meteor Stream': 'Rayon météore',
        'Meteor Project': 'Projet Météore',
        'Mark II Magitek Comet': 'Comète magitek II',
        'Magitek Meteor': 'Météore magitek',
        '(?<! )Magitek Comet': 'Comète magitek',
        'Landing': 'Chute de Météore',
        'Liquefaction': 'Sables mouvants',
        '(?<! )Homing Lasers': 'Lasers autoguidés',
        'High-Powered Homing Lasers': 'Lasers autoguidés surpuissants',
        'Helicoclaw': 'Héliogriffes',
        'Flexiclaw': 'Flexigriffes',
        'Dalamud Impact': 'Impact de Dalamud',
        'Burst': 'Éclats cosmique',
        'Bradamante': 'Bradamante',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'The Ruby Weapon': 'ルビーウェポン',
        'Raven\'s Image': 'ネールの幻影',
        'Comet': 'コメット',
      },
      'replaceText': {
        '--cutscene--': '--カットシン--',
        'Undermine': 'クローマイン',
        'Stamp': 'ストンピング',
        'Spike Of Flame': '爆炎',
        'Ruby Ray': 'ルビーレイ',
        'Ruby Dynamics': 'ルビーダイナモ',
        'Ravensflight': 'レイヴェンダイブ',
        'Ravensclaw': 'レイヴェンクロー',
        'Optimized Ultima': '魔導アルテマ',
        'Liquefaction': 'リクェファクション',
        '(?<! )Homing Lasers': '誘導レーザー',
        'High-Powered Homing Lasers': '高出力誘導レーザー',
        'Helicoclaw': 'スパイラルクロー',
        'Flexiclaw': 'フレキシブルクロー',
        'Meteor Project': 'メテオ計劃',
        'Negative Personae': 'ネガティブペルソナ',
        'Meteor Stream': 'メテオストリーム',
        'Ruby Claw': 'ルビークロー',
        'Dalamud Impact': 'ダラガブインパクト',
        'Magitek Comet': '魔導コメット',
        'Landing': '落着',
        'Magitek Meteor': '魔導メテオ',
        'Burst': '飛散',
        'Bradamante': 'ブラダマンテ',
        'Outrage': 'アウトレイジ',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'The Ruby Weapon': '红宝石神兵',
        'Raven\'s Image': '奈尔的幻影',
        'Comet': '彗星',
      },
      'replaceText': {
        '--cutscene--': '--过场动画--',
        'Stamp': '重踏',
        'Optimized Ultima': '魔导究极',
        'Flexiclaw': '潜地爪',
        'Ravensclaw': '凶鸟爪',
        'Spike Of Flame': '爆炎柱',
        'Liqu[ei]faction': '地面液化',
        'Ruby Ray': '红宝石射线',
        'Helicoclaw': '螺旋爪',
        'High-Powered Homing Lasers': '高功率诱导射线',
        'Ravensflight': '凶鸟冲',
        '(?<! )Homing Lasers': '诱导射线',
        'Ruby Dynamics': '红宝石电圈',
        'Undermine': '掘地雷',
        'Meteor Project': '陨石计划',
        'Negative Personae': '消极人格',
        'Meteor Stream': '陨石流',
        'Ruby Claw': '红宝石之爪',
        'Dalamud Impact': '卫月冲击',
        '(?<! )Magitek Comet': '魔导彗星',
        'Landing': '落地',
        'Magitek Meteor': '魔导陨石',
        'Burst': '飞散',
        'Mark II Magitek Comet': '魔导彗星II',
        'Bradamante': '布拉达曼特',
        'Outrage': '震怒',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'The Ruby Weapon': '루비 웨폰',
        'Raven\'s Image': '넬의 환영',
        'Comet': '혜성',
      },
      'replaceText': {
        '--cutscene--': '--컷신--',
        'Stamp': '발구름',
        'Optimized Ultima': '마도 알테마',
        'Flexiclaw': '가변 발톱',
        'Ravensclaw': '흉조 발톱',
        'Spike Of Flame': '폭염',
        'Liqu[ei]faction': '융해',
        'Ruby Ray': '루비 광선',
        'Helicoclaw': '나선 발톱',
        'High-Powered Homing Lasers': '고출력 유도 레이저',
        'Ravensflight': '흉조 돌진',
        '(?<! )Homing Lasers': '유도 레이저',
        'Ruby Dynamics': '루비의 원동력',
        'Undermine': '발톱 지뢰',
        'Meteor Project': '메테오 계획',
        'Negative Personae': '부정적 페르소나',
        'Meteor Stream': '유성 폭풍',
        'Ruby Claw': '루비 발톱',
        'Dalamud Impact': '달라가브 낙하',
        '(?<! )Magitek Comet': '마도 혜성',
        'Landing': '경착륙',
        'Magitek Meteor': '마도 메테오',
        'Burst': '산산조각',
        'Mark II Magitek Comet': '마도 혜성 2',
        'Bradamante': '브라다만테',
        'Outrage': '격노',
      },
    },
  ],
};

export default triggerSet;
