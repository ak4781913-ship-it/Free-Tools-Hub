export interface PhotoPromptInputs {
  subjectType: string;
  subjectDescription: string;
  style: string;
  setting: string;
  clothing: string;
  lighting: string;
  cameraAngle: string;
  moodAndColor: string;
  aspectRatio: string;
  qualityLevel: string;
  preserveIdentity: boolean;
  enhanceOnly: boolean;
  negativeConstraints: string;
  customNotes: string;
}

export interface VideoScene {
  id: string;
  sceneNumber: number;
  durationSeconds: number;
  visualDescription: string;
  cameraMovement: string;
  characterAction: string;
  dialogue: string;
  voiceStyle: string;
  audioSfx: string;
  transition: string;
}

export interface VideoPromptInputs {
  purpose: string;
  mainSubject: string;
  totalDurationSeconds: number;
  aspectRatio: string;
  visualStyle: string;
  lightingEnvironment: string;
  characterConsistency: boolean;
  consistentCharacterDetails: string;
  musicMood: string;
  languageAndAccent: string;
  resolution: string;
  scenes: VideoScene[];
}

export function buildGeminiPhotoPrompt(inputs: PhotoPromptInputs): string {
  if (inputs.enhanceOnly) {
    return `[IMAGE ENHANCEMENT & UPSCALING PROMPT]
Request: Enhance the input reference image with maximum fidelity.
Action: Dramatically increase optical resolution, clarify micro-textures (skin pores, fabric weave, reflections), remove noise artifacts, and balance exposure and dynamic range.
Strict Instruction: Preserve original face identity, facial geometry, pose, expression, lighting direction, background elements, and overall composition with 100% fidelity. Do not invent new background items or alter subject anatomy.
Output Target: 8k UHD photographic clarity, crystal-clear iris reflections, natural uncompressed color grading.`;
  }

  if (inputs.preserveIdentity) {
    return `[FACIAL & CHARACTER IDENTITY PRESERVATION EDITING PROMPT]
Primary Directive: Maintain exact facial geometry, bone structure, eye color, nose shape, and distinct identity of the reference subject across the generation.
Preserved Elements: Subject's facial likeness, authentic skin undertones, body proportions.
Modified Elements:
- New Setting/Environment: ${inputs.setting || 'photographic studio environment'}
- Attire & Wardrobe: ${inputs.clothing || 'modern styled outfit'}
- Scene Lighting: ${inputs.lighting || 'dramatic volumetric studio lighting'}
- Photographic Style: ${inputs.style || 'cinematic portraiture'}
- Camera Optics & Framing: ${inputs.cameraAngle || 'eye-level medium close-up, 85mm f/1.4 lens'}
- Color Grading & Atmosphere: ${inputs.moodAndColor || 'warm cinematic color grading'}
Quality Specifications: ${inputs.qualityLevel || 'ultra-detailed, 8k resolution, raw commercial photography'}${inputs.aspectRatio ? `, aspect ratio --ar ${inputs.aspectRatio}` : ''}
${inputs.negativeConstraints ? `Negative Constraints (Avoid): ${inputs.negativeConstraints}` : 'Negative Constraints: No face distortion, no plastic skin smoothing, no extra limbs, no blurry optics.'}
${inputs.customNotes ? `Additional Instructions: ${inputs.customNotes}` : ''}`;
  }

  // Standard high-fidelity generative prompt
  const parts: string[] = [];

  const subjectText = inputs.subjectDescription
    ? inputs.subjectDescription
    : `A captivating ${inputs.subjectType || 'subject'}`;

  parts.push(`${inputs.style || 'Cinematic'} photograph of ${subjectText}`);

  if (inputs.clothing) {
    parts.push(`wearing ${inputs.clothing}`);
  }

  if (inputs.setting) {
    parts.push(`set in ${inputs.setting}`);
  }

  if (inputs.cameraAngle) {
    parts.push(`captured from ${inputs.cameraAngle}`);
  }

  if (inputs.lighting) {
    parts.push(`illuminated by ${inputs.lighting}`);
  }

  if (inputs.moodAndColor) {
    parts.push(`with ${inputs.moodAndColor}`);
  }

  if (inputs.qualityLevel) {
    parts.push(inputs.qualityLevel);
  }

  if (inputs.customNotes) {
    parts.push(inputs.customNotes);
  }

  let finalPrompt = parts.join(', ') + '.';

  if (inputs.aspectRatio) {
    finalPrompt += ` Aspect ratio: ${inputs.aspectRatio}.`;
  }

  if (inputs.negativeConstraints) {
    finalPrompt += `\nNegative constraints: Avoid ${inputs.negativeConstraints}.`;
  }

  return finalPrompt;
}

export function buildCompleteVideoPrompt(inputs: VideoPromptInputs): string {
  const sections: string[] = [];

  sections.push(`[AI VIDEO PRODUCTION SPECIFICATION]
Purpose: ${inputs.purpose.toUpperCase()}
Core Subject / Concept: ${inputs.mainSubject}
Total Runtime: ${inputs.totalDurationSeconds} seconds | Aspect Ratio: ${inputs.aspectRatio} | Target Resolution: ${inputs.resolution}
Visual Style: ${inputs.visualStyle}
Environment & Lighting: ${inputs.lightingEnvironment}
Audio Design: ${inputs.musicMood} | Language/Accent: ${inputs.languageAndAccent}`);

  if (inputs.characterConsistency) {
    sections.push(`[GLOBAL CHARACTER CONSISTENCY MANDATE]
Core Subject: ${inputs.mainSubject}
Identity Retention: ${inputs.consistentCharacterDetails || 'Keep consistent facial anatomy, hairstyle, skin tone, and primary wardrobe across all cuts and camera movements.'}`);
  }

  sections.push(`[SCENE-BY-SCENE DIRECTORIAL TIMELINE]`);

  inputs.scenes.forEach((scene, index) => {
    sections.push(`SCENE ${index + 1} (${scene.durationSeconds}s):
- Visual Description: ${scene.visualDescription}
- Camera Movement: ${scene.cameraMovement}
- Character Action: ${scene.characterAction}
- Spoken Dialogue: ${scene.dialogue ? `"${scene.dialogue}" (${scene.voiceStyle})` : 'None / Ambient'}
- Sound & SFX: ${scene.audioSfx || 'Subtle ambient track'}
- Transition Out: ${scene.transition}`);
  });

  return sections.join('\n\n');
}

export const PHOTO_PRESETS = [
  {
    title: 'Editorial Fashion Portrait',
    inputs: {
      subjectType: 'woman',
      subjectDescription: 'High-fashion editorial model with confident gaze',
      style: 'Vogue cover fashion editorial',
      setting: 'Minimalist brutalist architectural courtyard in Milan',
      clothing: 'Tailored oversized camel wool coat and structural black sunglasses',
      lighting: 'Crisp direct late-afternoon sunlight casting sharp geometric shadows',
      cameraAngle: 'Low-angle medium shot, Hasselblad 80mm lens, shallow depth of field',
      moodAndColor: 'Warm travertine stone palette, rich contrast, film grain texture',
      aspectRatio: '3:4',
      qualityLevel: 'Masterpiece, 8k resolution, raw editorial print scan',
      preserveIdentity: false,
      enhanceOnly: false,
      negativeConstraints: 'Over-smoothed skin, cartoon aesthetic, oversaturation, blurry eyes',
      customNotes: 'Highlight delicate fabric weaves and authentic skin pores.',
    },
  },
  {
    title: 'Luxury Watch Commercial Showcase',
    inputs: {
      subjectType: 'product',
      subjectDescription: 'Swiss titanium chronograph watch with exposed mechanical tourbillon',
      style: 'Luxury commercial studio',
      setting: 'Matte black slate stone surface with fine water condensation droplets',
      clothing: '',
      lighting: 'Precision rim lighting, diffused dual softbox highlights accentuating metallic edges',
      cameraAngle: 'Extreme macro close-up tilted 45 degrees, 100mm macro f/2.8 lens',
      moodAndColor: 'Sleek dark monochrome with subtle sapphire crystal anti-reflective blue sheen',
      aspectRatio: '16:9',
      qualityLevel: 'Commercial advertising standard, tack-sharp mechanical gears, 8k',
      preserveIdentity: false,
      enhanceOnly: false,
      negativeConstraints: 'Dust particles, scratches, washed out highlights, flat lighting',
      customNotes: 'Focus on jewel bearings and brushed bevels of the bezel.',
    },
  },
  {
    title: 'Cyberpunk Neon Street Scene',
    inputs: {
      subjectType: 'man',
      subjectDescription: 'Cybernetic courier leaning against a customized electric motorbike',
      style: 'Cyberpunk neon noir',
      setting: 'Rain-soaked Tokyo alleyway with reflective puddles and neon signage',
      clothing: 'Weathered waterproof tactical parka with subtle luminous fiber accents',
      lighting: 'Vibrant cyan and magenta neon backlighting cutting through humid rain mist',
      cameraAngle: 'Wide cinematic establishing shot, 35mm anamorphic lens with horizontal blue flares',
      moodAndColor: 'Moody desaturated shadows with punchy chromatic reflections',
      aspectRatio: '16:9',
      qualityLevel: 'Cinematic frame grab from 70mm IMAX film, volumetric steam',
      preserveIdentity: false,
      enhanceOnly: false,
      negativeConstraints: 'Muddy colors, low resolution, warped vehicle geometry',
      customNotes: 'Puddle reflections should show sharp inverted street signage.',
    },
  },
  {
    title: 'Executive Corporate Headshot',
    inputs: {
      subjectType: 'man',
      subjectDescription: 'Senior technology executive with warm, trustworthy smile',
      style: 'Corporate executive portrait',
      setting: 'Modern glass-and-steel boardroom with softly blurred city skyline outside',
      clothing: 'Crisp midnight navy tailored suit with open-collar white shirt',
      lighting: 'Large diffuse octabox key light with subtle rim separation light',
      cameraAngle: 'Eye-level head-and-shoulders portrait, 85mm prime lens at f/2.0',
      moodAndColor: 'Natural clean color grading, neutral white balance, professional polish',
      aspectRatio: '1:1',
      qualityLevel: 'Ultra-high definition studio portrait, natural skin textures',
      preserveIdentity: false,
      enhanceOnly: false,
      negativeConstraints: 'Artificial plastic skin, distorted collar, harsh glare on glasses',
      customNotes: 'Catchlights in pupils should be round and clean.',
    },
  },
];

export const VIDEO_PRESETS = [
  {
    title: 'Luxury Fragrance Commercial (30s)',
    inputs: {
      purpose: 'advertisement',
      mainSubject: 'Elegant protagonist exploring a coastal cliffside villa at dusk',
      totalDurationSeconds: 30,
      aspectRatio: '16:9',
      visualStyle: 'Cinematic 35mm film aesthetic, slow-motion elegance',
      lightingEnvironment: 'Warm golden hour dusk merging into deep twilight',
      characterConsistency: true,
      consistentCharacterDetails: 'Brunette female in silk ivory evening gown with emerald drop earrings',
      musicMood: 'Swelling orchestral strings and ambient Mediterranean waves',
      languageAndAccent: 'Soft French-accented English whisper',
      resolution: '4K Ultra HD',
      scenes: [
        {
          id: 's1',
          sceneNumber: 1,
          durationSeconds: 8,
          visualDescription: 'Drone glides over azure Mediterranean coastline toward an open minimalist clifftop terrace.',
          cameraMovement: 'Slow forward dolly expanding into panoramic reveal',
          characterAction: 'Protagonist stands at terrace edge, evening breeze catching silk gown.',
          dialogue: 'Some memories never fade...',
          voiceStyle: 'Whispered, evocative, intimate',
          audioSfx: 'Gentle ocean swells and breeze',
          transition: 'Crossfade',
        },
        {
          id: 's2',
          sceneNumber: 2,
          durationSeconds: 12,
          visualDescription: 'Extreme close-up of crystal perfume bottle on travertine plinth; light prisms refract across flacon.',
          cameraMovement: 'Subtle slow orbit with focal rack to protagonist in background',
          characterAction: 'Protagonist picks up the bottle and gently spritzes wrist with a serene glance.',
          dialogue: 'They become your signature.',
          voiceStyle: 'Confident, sophisticated',
          audioSfx: 'Delicate atomized spray mist sound, glass clink',
          transition: 'Match cut',
        },
        {
          id: 's3',
          sceneNumber: 3,
          durationSeconds: 10,
          visualDescription: 'Protagonist turns toward camera as golden sunlight gives way to midnight blue twilight.',
          cameraMovement: 'Slow cinematic push-in to medium close-up, ending on title card overlay',
          characterAction: 'Slight enigmatic smile toward camera as title card fades in.',
          dialogue: 'L\'Éternel. The new essence.',
          voiceStyle: 'Clear, resonant brand tagline',
          audioSfx: 'Final resonant piano chord and soft wave wash',
          transition: 'Fade to black',
        },
      ],
    },
  },
  {
    title: 'SaaS Mobile App Feature Teaser (15s)',
    inputs: {
      purpose: 'product promotion',
      mainSubject: 'Clean futuristic smartphone interface floating in physical workspace',
      totalDurationSeconds: 15,
      aspectRatio: '9:16',
      visualStyle: 'Modern high-tempo tech showcase, 3D motion graphics hybrid',
      lightingEnvironment: 'Clean daylight studio with soft pastel ambient gradients',
      characterConsistency: false,
      consistentCharacterDetails: 'Professional young designer using smartphone',
      musicMood: 'Upbeat electronic synth beat with crisp UI audio clicks',
      languageAndAccent: 'Modern American English, energetic and clear',
      resolution: '1080p Full HD',
      scenes: [
        {
          id: 's1',
          sceneNumber: 1,
          durationSeconds: 5,
          visualDescription: 'Fast zoom in onto messy desk covered in sticky notes, suddenly organizing into digital widgets.',
          cameraMovement: 'Speed ramp zoom into phone screen',
          characterAction: 'User taps one button on screen.',
          dialogue: 'Stop drowning in messy tabs.',
          voiceStyle: 'Punchy, conversational',
          audioSfx: 'Whoosh transition and clean snap',
          transition: 'Whip pan',
        },
        {
          id: 's2',
          sceneNumber: 2,
          durationSeconds: 6,
          visualDescription: 'Smooth UI cards animate into place, auto-categorizing tasks in real time.',
          cameraMovement: 'Dynamic 3D phone tilt tracking the UI interactions',
          characterAction: 'Finger swipes across screen with fluid haptic response.',
          dialogue: 'Automate your daily priorities in 3 seconds.',
          voiceStyle: 'Enthusiastic, solution-focused',
          audioSfx: 'Haptic click sequence and rising chord',
          transition: 'Crossfade',
        },
        {
          id: 's3',
          sceneNumber: 3,
          durationSeconds: 4,
          visualDescription: 'App icon locks into center screen with "Try Free Today" call-to-action button pulsing softly.',
          cameraMovement: 'Static hero framing with kinetic typography burst',
          characterAction: 'Screen displays App Store and Google Play badges.',
          dialogue: 'Download now. It\'s completely free.',
          voiceStyle: 'Direct call to action',
          audioSfx: 'Final positive chime',
          transition: 'Cut',
        },
      ],
    },
  },
];
