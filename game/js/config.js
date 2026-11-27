// Gobble Dash — configuration: canvas size, palette, tuning and stage data.
// One job: every number the rest of the game agrees on lives here.

export const VIEW_W = 960;
export const VIEW_H = 600;
export const WALL = 24; // thickness of the border wall around every stage

// Autumn palette — warm browns, harvest orange, leaf green, cream.
export const PALETTE = {
  grassLight: '#7fae4e',
  grassDark: '#6d9c42',
  dirt: '#c9a06a',
  dirtDark: '#b3854f',
  barnRed: '#a63d2f',
  barnDark: '#7e2c21',
  wood: '#8a5a33',
  woodDark: '#6b4423',
  hay: '#e3c25a',
  hayDark: '#c9a83c',
  leaf: '#4e7d32',
  cream: '#f7ead0',
  ink: '#2e2118',
  orange: '#e8862e',
  pumpkin: '#e07820',
  tileLight: '#efe3c8',
  tileDark: '#d9c49a',
  ovenHot: '#ff7a1a',
  danger: '#d63a2a',
  corn: '#ffd94a',
  turkeyBrown: '#8a5a2e',
  turkeyDark: '#6b4423',
};

export const TUNING = {
  turkeyWalk: 175,
  turkeySprint: 265,
  turkeyRadius: 16,
  staminaMax: 100,
  staminaDrain: 38, // per second while sprinting
  staminaRegen: 22, // per second while not sprinting
  staminaExhaustedUntil: 25, // must recover past this before sprinting again
  hopSpeed: 400,
  hopTime: 0.22,
  hopCooldown: 1.1,
  detectionTime: 0.55, // seconds inside the farmer's gaze before the chase
  loseSightTime: 2.4, // seconds out of sight before the farmer gives up
  searchTime: 4.5, // seconds the farmer hunts the last seen spot
  catchDistance: 27,
  lives: 3,
  cornPoints: 50,
  goldenCornPoints: 150,
  stageClearPoints: 500,
  winBonus: 1000,
};

// The three stages of the escape: farmyard, barn, kitchen. Harder as they go.
export const STAGES = [
  {
    name: 'THE FARMYARD',
    subtitle: 'Dawn — slip past the farmer, reach the gate',
    floor: 'farmyard',
    farmerSpeed: 92,
    farmerVision: 215,
    farmerVisionAngle: 1.25, // radians, half-angle of the sight cone
    dog: false,
    knife: false,
    oven: false,
    cornCount: 10,
    goldenCorn: 1,
  },
  {
    name: 'THE BARN',
    subtitle: 'Dusk — the dog is loose, the farmer is quicker',
    floor: 'barn',
    farmerSpeed: 108,
    farmerVision: 225,
    farmerVisionAngle: 1.2,
    dog: true,
    knife: false,
    oven: false,
    cornCount: 12,
    goldenCorn: 2,
  },
  {
    name: 'THE KITCHEN',
    subtitle: 'Night — dodge the oven and the carving knife',
    floor: 'kitchen',
    farmerSpeed: 122,
    farmerVision: 240,
    farmerVisionAngle: 1.15,
    dog: false,
    knife: true,
    oven: true,
    cornCount: 12,
    goldenCorn: 2,
  },
];
