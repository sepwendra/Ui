
import { GoogleGenAI } from "@google/genai";
import { Language, PromptResult, PromptConfig, SceneDetail } from "../types";

const buildPromptInstruction = (lang: Language, config: PromptConfig, isTextMode: boolean = false) => `
You are an expert master prompt engineer and cinematic director. 
${isTextMode 
  ? 'Transform the user\'s text idea/story/concept into an extraordinary, professional AI prompt production plan.' 
  : 'Analyze the attached media and extract an extraordinary, professional AI prompt production plan.'}

USER PREFERENCES & CONSTRAINTS:
- Language: ${lang === Language.ENGLISH ? 'English' : 'Indonesian'}
- Preferred Style Override: ${config.style}
- Creativity Temperature: ${config.strength}
- Face Consistency: ${config.faceConsistency ? 'YES (Provide ultra-detailed facial landmarks, eye color, bone structure, skin texture, distinct identifiers)' : 'Standard'}
- Target Total Duration: ${config.duration}
- Target Scene Count: EXACTLY ${config.sceneCount} scene(s) (From Scene 1 to Scene ${config.sceneCount})

PRODUCTION GUIDELINES:
1. Divide the concept/media into EXACTLY ${config.sceneCount} distinct, sequential scenes (Scene 1 to Scene ${config.sceneCount}).
2. The total length across all scenes MUST equal the requested duration of ${config.duration}. Calculate and assign realistic time intervals for each scene (for example, if total is ${config.duration} and ${config.sceneCount} scenes, divide duration logically across Scene 1 to ${config.sceneCount}).
3. For each scene, specify camera movement (e.g., pan, tilt, drone aerial, close-up dolly, slow-motion), lighting (golden hour, volumetric rays, neon Cyberpunk, high key), visual action, and a dedicated AI video generation prompt (compatible with Sora, Runway Gen-3, Kling, Luma, Pika, Veo).

STRICT OUTPUT FORMAT:
You MUST provide the response in two distinct parts separated strictly by the delimiter "|||SEP|||".

Part 1: Master Prompt & Scene Script
Provide:
- Master Concept & Narrative Overview (Style, Mood, Color Grading, Camera gear).
- Detailed Scene-by-Scene Breakdown for all ${config.sceneCount} scene(s):
  * Scene [Number] ([Duration interval])
  * Camera Shot & Movement
  * Visual Scene Action & Details
  * Scene Generation Prompt (ready to copy)
  * Audio / Sound Ambience

Part 2: A raw valid JSON object (no markdown quotes, no triple backticks), strictly structured as:
{
  "subject": "Detailed subject description",
  "environment": "Setting and environment details",
  "style": "Visual style details",
  "lighting": "Advanced lighting details",
  "color_palette": "Hex codes or detailed color palette",
  "composition": "Camera specs, angle, lens",
  "total_duration": "${config.duration}",
  "scene_count": ${config.sceneCount},
  "scenes": [
    {
      "scene_number": 1,
      "duration": "e.g. 00:00 - 00:05",
      "camera_movement": "e.g. Low angle drone push-in",
      "visual_description": "Detailed visual action in this scene",
      "prompt": "Optimized prompt for AI video generators for this specific scene",
      "audio_or_dialogue": "Ambient sound or audio cue"
    }
  ],
  "technical_settings": "Lens, frame rate (e.g. 24fps / 60fps), shutter angle, render engine",
  "mood": "Emotional tone",
  "negative_prompt": "What to avoid (blurry, distortion, low quality, artifacts)"
}
Make sure the "scenes" array in the JSON has EXACTLY ${config.sceneCount} items.
`;

const parseResult = (rawText: string, config: PromptConfig): PromptResult => {
  const parts = rawText.split("|||SEP|||");
  const textPrompt = (parts[0] || rawText).trim();
  
  let jsonString = (parts[1] || "").replace(/```json/gi, '').replace(/```/g, '').trim();
  
  // If JSON is empty or malformed, attempt fallback
  if (!jsonString || !jsonString.startsWith('{')) {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    } else {
      jsonString = JSON.stringify({
        subject: "AI Generated Prompt",
        total_duration: config.duration,
        scene_count: config.sceneCount,
        scenes: []
      }, null, 2);
    }
  }

  let scenes: SceneDetail[] = [];
  try {
    const parsedObj = JSON.parse(jsonString);
    if (Array.isArray(parsedObj.scenes)) {
      scenes = parsedObj.scenes.map((s: any, idx: number) => ({
        sceneNumber: typeof s.scene_number === 'number' ? s.scene_number : idx + 1,
        duration: s.duration || `${config.duration} (Scene ${idx + 1})`,
        cameraMovement: s.camera_movement || '',
        visualDescription: s.visual_description || s.description || '',
        prompt: s.prompt || '',
        audioOrDialogue: s.audio_or_dialogue || s.audio || ''
      }));
    }
    // Pretty-format valid JSON string
    jsonString = JSON.stringify(parsedObj, null, 2);
  } catch {
    // If parse failed, scenes remains empty or extracted from text
  }

  return {
    textPrompt,
    jsonPrompt: jsonString,
    scenes: scenes.length > 0 ? scenes : undefined,
    metadata: {
      totalDuration: config.duration,
      sceneCount: config.sceneCount,
    }
  };
};

export const analyzeMedia = async (
  file: File,
  language: Language,
  config: PromptConfig
): Promise<PromptResult> => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });
  
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: {
      parts: [
        { text: buildPromptInstruction(language, config, false) },
        { inlineData: { data: base64Data, mimeType: file.type } },
      ],
    },
    config: {
      temperature: config.strength,
      topP: 0.8,
    }
  });

  const rawText = response.text || "";
  return parseResult(rawText, config);
};

export const generatePromptFromText = async (
  userText: string,
  language: Language,
  config: PromptConfig
): Promise<PromptResult> => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: {
      parts: [
        { text: buildPromptInstruction(language, config, true) },
        { text: `USER CONCEPT / PROMPT IDEA:\n"""\n${userText}\n"""\n\nGenerate the complete prompt breakdown with ${config.sceneCount} scene(s) and total duration of ${config.duration}.` },
      ],
    },
    config: {
      temperature: config.strength,
      topP: 0.8,
    }
  });

  const rawText = response.text || "";
  return parseResult(rawText, config);
};
