import { MissionGeneratorParams, OutdoorMission, MissionInstructionStep, ChecklistItem } from '../types/mission';

interface TopicBlueprint {
  titleTemplates: string[];
  focus: string;
  checklistPool: string[];
  equipmentPool: string[];
  safetyPool: string[];
  stepPool: {
    low: MissionInstructionStep[];
    medium: MissionInstructionStep[];
    high: MissionInstructionStep[];
  };
}

const TOPIC_BLUEPRINTS: Record<string, TopicBlueprint> = {
  Birdwatching: {
    titleTemplates: [
      'Canopy Acoustic Survey & Avian Flight Paths',
      'The Silent Perch: High-Branch Foraging Watch',
      'Morning Feather & Song Silhouette Expedition',
      'Understory Fledgling & Nesting Sign Patrol',
    ],
    focus: 'Detecting subtle song patterns, wing beats, and feeding behavior in native birds.',
    checklistPool: [
      'Locate and identify 3 distinct bird vocalizations (call note vs territorial song)',
      'Spot an avian perch at least 4 meters up without moving your feet for 5 minutes',
      'Observe a bird feeding or foraging (probing bark, gleaning foliage, or pecking ground)',
      'Find discarded feathers or nesting material along fence lines or branch crotches',
      'Note flight pattern rhythm (bounding flaps vs steady soaring glides)',
    ],
    equipmentPool: ['Compact binoculars or monocular', 'Pocket field guide', 'Field notebook & graphite pencil'],
    safetyPool: [
      'Keep safe distance from active nesting sites (minimum 15 meters)',
      'Watch footing while looking up into the canopy to avoid root trips',
    ],
    stepPool: {
      low: [
        {
          stepNumber: 1,
          phase: 'Auditory Grounding',
          instruction: 'Sit or lean quietly against a solid tree. Close eyes for 3 minutes to map the audio soundscape.',
        },
        {
          stepNumber: 2,
          phase: 'Slow Scanning',
          instruction: 'Pick one quadrant of branches. Keep your gaze steady and look for silhouette movement and leaf quivers.',
        },
        {
          stepNumber: 3,
          phase: 'Behavioral Logging',
          instruction: 'Track one single bird for at least 3 continuous minutes. Note its head tilts, posture, and flight path.',
        },
      ],
      medium: [
        {
          stepNumber: 1,
          phase: 'Trail Perimeter Walk',
          instruction: 'Walk softly along woodland or park edges where trees meet open meadows. Transition zones harbor the highest bird diversity.',
        },
        {
          stepNumber: 2,
          phase: 'Branch Micro-Scan',
          instruction: 'Pause every 20 paces. Look into low shrubs and mid-level canopies for foraging songbirds.',
        },
        {
          stepNumber: 3,
          phase: 'Call Mapping',
          instruction: 'Triangulate the direction of two different bird calls and quietly approach within visible range.',
        },
      ],
      high: [
        {
          stepNumber: 1,
          phase: 'Active Ridge Exploration',
          instruction: 'Hike uphill toward high canopy viewpoints and ridgelines where thermal air currents carry raptors and swallows.',
        },
        {
          stepNumber: 2,
          phase: 'Varied Canopy Transect',
          instruction: 'Move through three contrasting micro-habitats: dense cedar groves, open grassy glades, and water margins.',
        },
        {
          stepNumber: 3,
          phase: 'Species Tally & Habitat Analysis',
          instruction: 'Log differences in bird species observed across elevation and vegetation density changes.',
        },
      ],
    },
  },
  Mindfulness: {
    titleTemplates: [
      'Forest Bathing & Five-Senses Grounding',
      'Stillness in the Understory: Micro-Habitat Immersion',
      'Tactile Earth Meditation & Resonant Breathing',
      'The Slow Ecology Walk: Mindful Presence',
    ],
    focus: 'Calming nervous system overstimulation through immersive sensory presence in nature.',
    checklistPool: [
      'Touch 4 contrasting natural surfaces (rough bark, cool moss, smooth stone, dried leaf)',
      'Listen for 10 natural sounds before speaking or opening your eyes',
      'Smell crushed pine needles or damp humus soil and identify 2 distinct aromas',
      'Find a patch of dappled sunlight and feel the radiant warmth on your palms for 60 seconds',
      'Breathe in sync with the gentle sway of high canopy branches for 15 breaths',
    ],
    equipmentPool: ['Water canteen', 'Light sit-mat or jacket to sit on', 'No electronics on or ringing'],
    safetyPool: [
      'Be mindful of wet slippery logs and loose stones when finding a seat',
      'Avoid sitting directly on damp anthills or poison ivy patches',
    ],
    stepPool: {
      low: [
        {
          stepNumber: 1,
          phase: 'Threshold Breathing',
          instruction: 'Step outside and stand motionless for 2 minutes. Take 10 deep belly breaths, releasing screen fatigue with every exhale.',
        },
        {
          stepNumber: 2,
          phase: 'Tactile Grounding',
          instruction: 'Rest hands on an ancient tree trunk or stone. Feel texture, temperature, and grounded immobility.',
        },
        {
          stepNumber: 3,
          phase: 'Auditory Horizon',
          instruction: 'Expand your awareness from the closest sound (rustling leaves) to the furthest ambient rumble of wind.',
        },
      ],
      medium: [
        {
          stepNumber: 1,
          phase: 'The Slow Walking Stride',
          instruction: 'Walk at half your ordinary pace. Feel heel-to-toe contact with the earth on every step.',
        },
        {
          stepNumber: 2,
          phase: 'Botanical Stillness',
          instruction: 'Stop at a sunlit clearing. Close your eyes and name 5 distinct sensory inputs you can feel right now.',
        },
        {
          stepNumber: 3,
          phase: 'Natural Integration',
          instruction: 'Find a comfortable resting spot. Spend 10 minutes observing cloud movement without checking any clocks.',
        },
      ],
      high: [
        {
          stepNumber: 1,
          phase: 'Rhythmic Trail Cadence',
          instruction: 'Embark on an invigorating sustained trail walk. Synchronize your breathing rhythm with your footfalls (3 steps in, 3 steps out).',
        },
        {
          stepNumber: 2,
          phase: 'Summit Reflection',
          instruction: 'Reach a vista or clearing, slow down, and transition into complete physical stillness for 8 minutes.',
        },
        {
          stepNumber: 3,
          phase: 'Sensory Decompression',
          instruction: 'Reflect on the feeling of bodily exertion followed by outdoor tranquility. Let the mind rest.',
        },
      ],
    },
  },
  Trees: {
    titleTemplates: [
      'Dendrological Survey: Bark Textures & Crown Architecture',
      'Ancient Cedar & Hardwood Canopy Study',
      'Leaf Venation & Seed Cone Inventory',
      'The Living Trunk: Epiphyte & Lichen Ecology',
    ],
    focus: 'Investigating tree species morphology, bark micro-habitats, and canopy stratification.',
    checklistPool: [
      'Identify 3 different tree species by bark pattern (furrowed, scaly, peeling, or smooth)',
      'Look straight up into the crown and observe crown shyness or leaf interlocking',
      'Examine a tree base for moss or lichen communities and note which direction it faces',
      'Collect or sketch 2 different fallen leaves, examining primary and secondary vein architecture',
      'Estimate the age and trunk circumference of the oldest tree in your immediate area',
    ],
    equipmentPool: ['Small measuring tape or cord', 'Magnifying hand lens (optional)', 'Sketch pad or notebook'],
    safetyPool: [
      'Do not climb dead or brittle branches',
      'Watch for overhead deadwood (“widow-makers”) on windy days',
    ],
    stepPool: {
      low: [
        {
          stepNumber: 1,
          phase: 'Trunk Architecture Inspection',
          instruction: 'Approach a mature deciduous or coniferous tree. Run fingertips gently over the bark ridges and fissures.',
        },
        {
          stepNumber: 2,
          phase: 'Canopy Angle Observation',
          instruction: 'Lean back against the trunk and look vertically up through the crown. Notice how light filters through the foliage.',
        },
        {
          stepNumber: 3,
          phase: 'Root Crown Survey',
          instruction: 'Inspect exposed buttress roots and leaf litter decomposition around the drip line.',
        },
      ],
      medium: [
        {
          stepNumber: 1,
          phase: 'Woodland Transect',
          instruction: 'Walk through an open grove or park pathway, noting where species shift from shade-tolerant to sun-loving.',
        },
        {
          stepNumber: 2,
          phase: 'Bark & Leaf Pairing',
          instruction: 'Match fallen leaves on the ground with their parent canopies above. Document distinctive lobe shapes.',
        },
        {
          stepNumber: 3,
          phase: 'Ecosystem Symbiosis',
          instruction: 'Look for fungal growth, woodpecker boreholes, or sap wells along trunk hollows.',
        },
      ],
      high: [
        {
          stepNumber: 1,
          phase: 'Forest Elevation Transect',
          instruction: 'Hike across changing terrain (creek valley to dry ridge) to observe how tree species adapt to soil moisture.',
        },
        {
          stepNumber: 2,
          phase: 'Old-Growth Search',
          instruction: 'Seek out the largest specimen in the stand. Document its trunk flare and branch spread.',
        },
        {
          stepNumber: 3,
          phase: 'Crown Density Analysis',
          instruction: 'Compare light penetration between coniferous evergreen stands and broadleaf deciduous groves.',
        },
      ],
    },
  },
  Photography: {
    titleTemplates: [
      'Macro Texture & Dappled Light Field Study',
      'Natural Geometry & Botanical Shadows Expedition',
      'Vascular Patterns & Organic Silhouettes',
      'Earth & Water Reflection Photography Quest',
    ],
    focus: 'Composing mindful botanical and landscape frames using natural light and organic geometry.',
    checklistPool: [
      'Capture a macro detail of leaf veins, dew, or insect antennae',
      'Frame an image emphasizing natural repeating patterns or symmetry in plant structures',
      'Photograph high-contrast shadows cast by foliage onto stone, earth, or tree bark',
      'Find and frame a natural reflection in puddle, stream, or morning dew droplet',
      'Shoot a wide silhouette shot against the sky with the sun filtered behind branches',
    ],
    equipmentPool: ['Camera or phone in Airplane Mode', 'Microfiber lens cloth', 'Clean natural lighting'],
    safetyPool: [
      'Keep eyes on your walking path rather than glued to the camera viewfinder',
      'Do not trample fragile native wild plants for a photograph',
    ],
    stepPool: {
      low: [
        {
          stepNumber: 1,
          phase: 'Light Scouting',
          instruction: 'Find a sheltered outdoor corner where side lighting illuminates textures without harsh glare.',
        },
        {
          stepNumber: 2,
          phase: 'Micro Focus Experimentation',
          instruction: 'Get down to knee height. Examine moss clusters, acorn caps, or bark furrows from 10cm away.',
        },
        {
          stepNumber: 3,
          phase: 'Composition Framing',
          instruction: 'Take 3 deliberate photographs exploring negative space, leading organic lines, and tactile textures.',
        },
      ],
      medium: [
        {
          stepNumber: 1,
          phase: 'Trail Scouting',
          instruction: 'Hike slowly along a scenic trail, observing where light creates natural spotlighting through canopy openings.',
        },
        {
          stepNumber: 2,
          phase: 'Scale & Depth Studies',
          instruction: 'Compose shots combining deep foreground botanical elements with distant landscape vistas.',
        },
        {
          stepNumber: 3,
          phase: 'Color Harmony Audit',
          instruction: 'Document subtle gradations of forest green, ochre earth, and sky reflections without filters.',
        },
      ],
      high: [
        {
          stepNumber: 1,
          phase: 'Panoramic Viewpoint Trek',
          instruction: 'Ascend to an open overlook or lake shore to capture sweeping geographical curves and cloudscapes.',
        },
        {
          stepNumber: 2,
          phase: 'Dynamic Motion Study',
          instruction: 'Experiment with framing moving water, windblown reeds, or shifting shadows on the forest floor.',
        },
        {
          stepNumber: 3,
          phase: 'Curated Natural Selection',
          instruction: 'Pick your single most truthful image from the session and note the ecological story behind it.',
        },
      ],
    },
  },
  Insects: {
    titleTemplates: [
      'Micro-Safari: Leaf Litter & Pollinator Watch',
      'Under the Bark: Arthropod Habitat Exploration',
      'Flower Head Pollinator Patrol & Flight Observation',
      'The Decomposer Kingdom: Fallen Log Ecology',
    ],
    focus: 'Investigating arthropod biodiversity, pollinator movements, and soil decomposers.',
    checklistPool: [
      'Observe a pollinator visiting at least 2 consecutive flowers without disturbing it',
      'Gently turn over a fallen bark piece or stone (replace it carefully) to view soil arthropods',
      'Locate an active spider web and trace its radial structural anchor threads',
      'Spot an ant trail and follow it back to find what food source is being transported',
      'Find signs of insect life (leaf gall, leaf-cutter bee circle, or caterpillar chewing sign)',
    ],
    equipmentPool: ['Magnifying hand lens or smartphone macro', 'Field notepad', 'Soft twig for gentle inspection'],
    safetyPool: [
      'Always replace turned stones or logs in their exact original position to preserve micro-climates',
      'Do not touch stinging insects, unknown caterpillars, or tick-prone brush without checking ankles',
    ],
    stepPool: {
      low: [
        {
          stepNumber: 1,
          phase: 'Garden / Flower Bed Station',
          instruction: 'Sit patiently next to flowering bushes, clover, or wild herbs. Remain completely still for 4 minutes.',
        },
        {
          stepNumber: 2,
          phase: 'Flight Observation',
          instruction: 'Track bumblebees, hoverflies, or butterflies as they hover, land, and probe blossoms for nectar.',
        },
        {
          stepNumber: 3,
          phase: 'Stem & Leaf Underside Check',
          instruction: 'Gently tilt leaves upward to discover resting beetles, aphids, or caterpillar eggs.',
        },
      ],
      medium: [
        {
          stepNumber: 1,
          phase: 'Woodland Floor Investigation',
          instruction: 'Walk softly into shaded woods. Look for rotting logs covered in soft moss and bracket fungi.',
        },
        {
          stepNumber: 2,
          phase: 'Micro-Community Inspection',
          instruction: 'Examine woodlice, millipedes, and ground beetles breaking down organic matter into nutrient-rich humus.',
        },
        {
          stepNumber: 3,
          phase: 'Behavioral Logging',
          instruction: 'Record how different arthropods react to light and touch. Carefully replace any disturbed habitat.',
        },
      ],
      high: [
        {
          stepNumber: 1,
          phase: 'Multi-Habitat Meadow Hike',
          instruction: 'Trek across sun-drenched meadow boundaries and damp creek ravines to compare insect diversity.',
        },
        {
          stepNumber: 2,
          phase: 'Grasshopper & Dragonfly Watch',
          instruction: 'Observe territorial dragonfly perches on reed tips and high-speed hunting sallies over water or grass.',
        },
        {
          stepNumber: 3,
          phase: 'Biodiversity Mapping',
          instruction: 'Count how many distinct insect families you can detect across the three habitats.',
        },
      ],
    },
  },
  Water: {
    titleTemplates: [
      'Riparian Zone Exploration & Stream Bed Survey',
      'Lake Shore Reflections & Aquatic Edge Ecology',
      'Hydrological Flow & Sediment Pattern Study',
      'Morning Dew & Micro-Droplet Surface Tension Watch',
    ],
    focus: 'Investigating aquatic margins, water movement, surface tension, and riparian vegetation.',
    checklistPool: [
      'Observe water flow around smooth stones and identify laminar vs turbulent eddies',
      'Look for water striders or aquatic insects utilizing surface tension',
      'Check water clarity and note whether bottom sediments are sand, silt, or gravel',
      'Observe plant adaptations along water banks (willows, rushes, sedges, or moss cushions)',
      'Listen to the acoustic frequency of running water or lap of waves for 3 uninterrupted minutes',
    ],
    equipmentPool: ['Waterproof footwear or boots', 'Drinking water bottle', 'Small towel or cloth'],
    safetyPool: [
      'Step carefully on wet algae-covered rocks which can be extremely slick',
      'Never drink untreated surface water from streams or lakes',
    ],
    stepPool: {
      low: [
        {
          stepNumber: 1,
          phase: 'Bankside Settling',
          instruction: 'Find a safe perch beside a stream, pond, fountain, or wetland margin. Watch the water surface undisturbed.',
        },
        {
          stepNumber: 2,
          phase: 'Surface Dynamics',
          instruction: 'Drop a single dry leaf into the current. Follow its downstream journey and note where it gets trapped.',
        },
        {
          stepNumber: 3,
          phase: 'Acoustic Attunement',
          instruction: 'Close your eyes. Listen to the high-pitched splash versus deep resonant bubbling tones.',
        },
      ],
      medium: [
        {
          stepNumber: 1,
          phase: 'Creek Meander Walk',
          instruction: 'Follow the bend of a brook or pond perimeter, observing how bank erosion shapes plant root exposure.',
        },
        {
          stepNumber: 2,
          phase: 'Submerged Life Check',
          instruction: 'Peer into shallow sunlit pools for minnows, tadpoles, caddisfly larvae cases, or snails.',
        },
        {
          stepNumber: 3,
          phase: 'Moisture Gradient Survey',
          instruction: 'Notice how soil transitions from saturated mud to damp loam within 5 paces of the shoreline.',
        },
      ],
      high: [
        {
          stepNumber: 1,
          phase: 'Watershed Elevation Hike',
          instruction: 'Hike uphill along a stream drainage from valley base to headwater spring or rocky cascade.',
        },
        {
          stepNumber: 2,
          phase: 'Flow Speed & Geology',
          instruction: 'Compare water velocity where the channel narrows between boulders versus wide gravel pools.',
        },
        {
          stepNumber: 3,
          phase: 'Ecosystem Synthesis',
          instruction: 'Document the entire riparian corridor: plants, aquatic insects, and animal tracks in shoreline mud.',
        },
      ],
    },
  },
};

// Fallback template for any interest
const GENERAL_BLUEPRINT: TopicBlueprint = {
  titleTemplates: [
    'Outdoor Sensory Immersion & Habitat Discovery',
    'Earth & Atmosphere Micro-Exploration',
    'The Naturalist Grounding Circuit',
    'Wild Horizon Observation Quest',
  ],
  focus: 'Connecting with local biodiversity, sky phenomena, and outdoor mindfulness.',
  checklistPool: [
    'Spot 3 wild plants growing without human cultivation',
    'Feel natural breeze direction and identify what triggers it',
    'Inspect a patch of soil for organic matter and small creatures',
    'Listen quietly for bird calls and wind through foliage for 4 minutes',
    'Find an interesting stone or pine cone and note its color gradient',
  ],
  equipmentPool: ['Comfortable outdoor shoes', 'Drinking water', 'Pocket notebook'],
  safetyPool: [
    'Stay aware of surroundings and weather shifts',
    'Stay hydrated and respect Leave No Trace ethics',
  ],
  stepPool: {
    low: [
      {
        stepNumber: 1,
        phase: 'Outdoor Awakening',
        instruction: 'Step into open air. Put phone into your pocket or bag. Take 5 slow, grounding breaths.',
      },
      {
        stepNumber: 2,
        phase: 'Quiet Observation',
        instruction: 'Observe your immediate surroundings with fresh eyes, noticing small details usually overlooked.',
      },
      {
        stepNumber: 3,
        phase: 'Sensory Reflection',
        instruction: 'Pick one natural object (leaf, stone, tree) and spend 5 minutes exploring its tactile qualities.',
      },
    ],
    medium: [
      {
        stepNumber: 1,
        phase: 'Paced Exploration',
        instruction: 'Begin a gentle walk through the park, trail, or neighbourhood green space at an unhurried tempo.',
      },
      {
        stepNumber: 2,
        phase: 'Pattern Discovery',
        instruction: 'Look for signs of season change: leaf tinting, seed dispersal, fungal fruiting, or animal foraging.',
      },
      {
        stepNumber: 3,
        phase: 'Field Notes',
        instruction: 'Stop at a scenic resting spot and reflect on the distinction between digital time and natural cycles.',
      },
    ],
    high: [
      {
        stepNumber: 1,
        phase: 'Dynamic Outdoor Route',
        instruction: 'Embark on an active trail route incorporating elevation changes and varying terrain textures.',
      },
      {
        stepNumber: 2,
        phase: 'Habitat Comparison',
        instruction: 'Contrast open exposed sunny zones with shaded dense vegetation corridors.',
      },
      {
        stepNumber: 3,
        phase: 'Full Immersion Check',
        instruction: 'Conclude with 5 minutes of total stillness to let your body settle before returning to screen life.',
      },
    ],
  },
};

export function generateHeuristicMission(params: MissionGeneratorParams): OutdoorMission {
  const primaryInterest = params.interests[0] || 'Mindfulness';
  const blueprint = TOPIC_BLUEPRINTS[primaryInterest] || GENERAL_BLUEPRINT;
  const secondaryInterest = params.interests[1];
  const secondaryBlueprint = secondaryInterest ? TOPIC_BLUEPRINTS[secondaryInterest] : null;

  // Title selection
  const titleBase = blueprint.titleTemplates[Math.floor(Math.random() * blueprint.titleTemplates.length)];
  const locationTag = params.locationHint ? ` at ${params.locationHint}` : '';
  const title = `${titleBase}${locationTag}`;

  // Description
  const energyWord = params.energyLevel === 'Low' ? 'gentle, restorative' : params.energyLevel === 'Medium' ? 'focused, exploratory' : 'invigorating, active';
  const durationDesc = `${params.durationMinutes} minutes`;
  const description = `A ${energyWord} outdoor expedition tailored for ${durationDesc} of screen-free exploration. Focuses on ${blueprint.focus}${
    secondaryInterest ? ` Blended with ${secondaryInterest.toLowerCase()} observations.` : ''
  }`;

  // Steps by energy
  const energyKey = params.energyLevel.toLowerCase() as 'low' | 'medium' | 'high';
  let steps = [...blueprint.stepPool[energyKey]];

  if (params.durationMinutes >= 60 && steps.length < 4) {
    // Add extension step for longer journeys
    steps.push({
      stepNumber: steps.length + 1,
      phase: 'Deep Ecological Integration',
      instruction:
        'Spend the final 15 minutes in silent contemplation or journaling. Allow your sensory observations to crystallize before heading inside.',
    });
  }

  // Adjust step numbers
  steps = steps.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));

  // Checklist compilation
  const checklistTexts = [...blueprint.checklistPool];
  if (secondaryBlueprint) {
    checklistTexts.push(...secondaryBlueprint.checklistPool.slice(0, 2));
  }
  // Shuffle & pick 4-5
  const selectedChecklist = checklistTexts
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.min(5, Math.max(3, Math.round(params.durationMinutes / 15))))
    .map((text, i) => ({
      id: `check_${Date.now()}_${i}`,
      text,
      completed: false,
    }));

  // Equipment
  const equipment = Array.from(
    new Set([
      ...blueprint.equipmentPool,
      ...(secondaryBlueprint ? secondaryBlueprint.equipmentPool : []),
      'Phone kept silent in pocket',
    ])
  );

  // Safety
  const safetyTips = Array.from(
    new Set([
      ...blueprint.safetyPool,
      'Check local weather conditions before heading out',
      'Follow Leave No Trace principles: leave what you find and pack out any trash',
    ])
  );

  // Purpose & Personalized Intro
  const purpose = `Disconnect from digital devices for ${params.durationMinutes} minutes to investigate ${blueprint.focus.toLowerCase()}`;
  const personalizedIntro = `Welcome to your mindful outdoor session. Set your phone to silent, take a slow breath of fresh air, and step into the living world with open curiosity.`;

  // Dynamic sensory prompts based on selected interests
  const sensorySight = params.interests.includes('Birdwatching')
    ? 'Scan branch perches for sudden flutter or silhouette shifts against the sky.'
    : params.interests.includes('Trees')
    ? 'Look vertically up into tree crowns to observe branch angles and leaf light filters.'
    : params.interests.includes('Photography')
    ? 'Notice how dappled sunlight creates micro-shadows along moss cushions and bark furrows.'
    : 'Notice subtle gradients of forest green, ochre earth, and changing light.';

  const sensorySound = params.interests.includes('Water')
    ? 'Listen to the multi-tonal frequency of moving water versus wind rustling reeds.'
    : 'Close your eyes for 60 seconds; isolate the farthest natural sound from the closest leaf rustle.';

  const sensoryTouch = 'Gently touch two contrasting textures: weathered bark and cool damp moss or stone.';
  const sensorySmell = 'Take a deep breath near moist humus, crushed fallen pine needles, or living foliage.';

  const fieldNotesPrompt =
    'When you return, record the one small natural detail that surprised you or the feeling of stepping away from digital notifications.';

  return {
    id: `mission_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    title,
    purpose,
    description,
    personalizedIntro,
    durationMinutes: params.durationMinutes,
    energyLevel: params.energyLevel,
    interests: params.interests,
    locationHint: params.locationHint,
    instructions: steps,
    sensoryPrompts: {
      sight: sensorySight,
      sound: sensorySound,
      touch: sensoryTouch,
      smell: sensorySmell,
    },
    fieldNotesPrompt,
    safetyTips,
    equipment,
    checklist: selectedChecklist,
    status: 'not_started',
    createdAt: new Date().toISOString(),
    source: 'heuristic_engine',
    modelUsed: 'Offline Botanical Heuristic Engine v2.4 (Rule-Based)',
  };
}
