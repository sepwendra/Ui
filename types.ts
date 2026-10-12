
export enum Language {
  INDONESIAN = 'id',
  ENGLISH = 'en'
}

export enum OutputFormat {
  TEXT = 'text',
  SCENES = 'scenes',
  JSON = 'json'
}

export enum MediaMode {
  IMAGE = 'image',
  VIDEO = 'video',
  TEXT = 'text'
}

export type PromptStyle = 'auto' | 'photorealistic' | 'digital_art' | 'anime' | 'cinematic' | 'cyberpunk' | 'oil_painting';

export type VideoDuration = '5s' | '10s' | '15s' | '39s' | '60s';

export interface SceneDetail {
  sceneNumber: number;
  duration?: string;
  cameraMovement?: string;
  visualDescription: string;
  prompt: string;
  audioOrDialogue?: string;
}

export interface PromptConfig {
  style: PromptStyle;
  strength: number; // 0.1 to 1.0 (temperature)
  faceConsistency: boolean;
  sceneDetection: boolean;
  sceneCount: number; // 1 to 10
  duration: VideoDuration; // '5s' | '10s' | '15s' | '39s' | '60s'
}

export interface PromptResult {
  textPrompt: string;
  jsonPrompt: string;
  scenes?: SceneDetail[];
  metadata?: {
    lightingInfo?: string;
    styleDetected?: string;
    totalDuration?: string;
    sceneCount?: number;
  };
}

export interface AppTranslation {
  title: string;
  subtitle: string;
  uploadLabel: string;
  generateBtn: string;
  generating: string;
  copySuccess: string;
  downloadLabel: string;
  settingsTitle: string;
  styles: Record<PromptStyle, string>;
  labels: {
    style: string;
    strength: string;
    faceLock: string;
    sceneDetection: string;
    sceneCount: string;
    duration: string;
    creative: string;
    precise: string;
    textInputLabel: string;
    textPlaceholder: string;
    sampleIdeas: string;
    sceneCard: string;
    camera: string;
    audio: string;
    copyScene: string;
  };
  modes: {
    image: string;
    video: string;
    text: string;
  };
  durations: Record<VideoDuration, string>;
  formats: {
    text: string;
    scenes: string;
    json: string;
  };
  errors: {
    noMedia: string;
    noText: string;
    apiError: string;
    wrongType: string;
  };
}

export const translations: Record<Language, AppTranslation> = {
  [Language.ENGLISH]: {
    title: "Explore AI Prompt",
    subtitle: "Generate expert prompts from text, images, and videos with scene & duration controls",
    uploadLabel: "Click to upload or drag and drop",
    generateBtn: "Generate Expert Prompt",
    generating: "Generating AI scenes & prompts...",
    copySuccess: "Copied!",
    downloadLabel: "Download JSON",
    settingsTitle: "Expert Settings",
    styles: {
      auto: "Auto Detect",
      photorealistic: "Photorealistic",
      digital_art: "Digital Art",
      anime: "Anime / Manga",
      cinematic: "Cinematic Movie",
      cyberpunk: "Cyberpunk / Neon",
      oil_painting: "Oil Painting"
    },
    labels: {
      style: "Preferred Style",
      strength: "Prompt Creativity",
      faceLock: "Face Consistency Lock",
      sceneDetection: "Auto Scene Detection",
      sceneCount: "Number of Scenes (1 - 10)",
      duration: "Duration",
      creative: "Creative",
      precise: "Precise",
      textInputLabel: "Write Prompt Idea / Story Concept",
      textPlaceholder: "Describe your concept, story, cinematic scene, character actions, or video idea here...",
      sampleIdeas: "Quick Ideas:",
      sceneCard: "Scene",
      camera: "Camera Movement",
      audio: "Audio / Sound",
      copyScene: "Copy Scene Prompt"
    },
    modes: {
      image: "Image Mode",
      video: "Video Mode",
      text: "Prompt from Text"
    },
    durations: {
      '5s': '5s',
      '10s': '10s',
      '15s': '15s',
      '39s': '39s',
      '60s': '60s'
    },
    formats: {
      text: "Master Prompt",
      scenes: "Scenes (1-10)",
      json: "JSON Prompt"
    },
    errors: {
      noMedia: "Please upload a file first.",
      noText: "Please write a prompt or story concept first.",
      apiError: "Failed to generate prompt. Please try again.",
      wrongType: "Incorrect file type for selected mode."
    }
  },
  [Language.INDONESIAN]: {
    title: "Tools Prompt Finder",
    subtitle: "Buat prompt pakar dari teks, gambar, dan video dengan kontrol jumlah scene & durasi",
    uploadLabel: "Klik untuk unggah atau seret file",
    generateBtn: "Hasilkan Prompt Pakar",
    generating: "Menganalisis & menyusun adegan...",
    copySuccess: "Disalin!",
    downloadLabel: "Unduh JSON",
    settingsTitle: "Pengaturan Pakar",
    styles: {
      auto: "Deteksi Otomatis",
      photorealistic: "Fotorealistik",
      digital_art: "Seni Digital",
      anime: "Anime / Manga",
      cinematic: "Film Sinematik",
      cyberpunk: "Cyberpunk / Neon",
      oil_painting: "Lukisan Cat Minyak"
    },
    labels: {
      style: "Gaya Pilihan",
      strength: "Kreativitas Prompt",
      faceLock: "Kunci Konsistensi Wajah",
      sceneDetection: "Deteksi Adegan Otomatis",
      sceneCount: "Jumlah Scene (1 - 10 Scene)",
      duration: "Pilihan Durasi",
      creative: "Kreatif",
      precise: "Presisi",
      textInputLabel: "Tulis Ide Teks / Konsep Cerita",
      textPlaceholder: "Tuliskan konsep cerita, deskripsi video, karakter, atau ide adegan yang ingin dibuatkan prompt...",
      sampleIdeas: "Contoh Ide Cepat:",
      sceneCard: "Scene",
      camera: "Gerakan Kamera",
      audio: "Audio / Suara",
      copyScene: "Salin Prompt Scene"
    },
    modes: {
      image: "Mode Gambar",
      video: "Mode Video",
      text: "Buat Prompt dari Teks"
    },
    durations: {
      '5s': '5 Detik (5 s)',
      '10s': '10 Detik (10 s)',
      '15s': '15 Detik (15 s)',
      '39s': '39 Detik (39 s)',
      '60s': '60 Detik (60 s)'
    },
    formats: {
      text: "Prompt Teks",
      scenes: "Detail Scene (1-10)",
      json: "Prompt JSON"
    },
    errors: {
      noMedia: "Harap unggah file terlebih dahulu.",
      noText: "Harap masukkan ide teks atau konsep cerita terlebih dahulu.",
      apiError: "Gagal menghasilkan prompt. Silakan coba lagi.",
      wrongType: "Jenis file tidak sesuai dengan mode terpilih."
    }
  }
};
