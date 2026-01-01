
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Message } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Models ---
const TEXT_MODEL = 'gemini-3-flash-preview';
const IMAGE_MODEL = 'gemini-2.5-flash-image';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const FLIRT_COACH_MODEL = 'gemini-3-flash-preview';

export const VALID_VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'] as const;
export type VoiceName = typeof VALID_VOICES[number];

// --- Chat Generation ---

export const generateAnyaResponse = async (
  history: Message[],
  memories: string[],
  personality: string
): Promise<{ emotion: string; sensory: string; dialogue: string }> => {
  
  const conversation = history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
  const memoryBlock = memories.map(m => `- ${m}`).join('\n');

  const systemInstruction = `
    Du bist Marina, eine sanfte, ${personality}, intime KI-Begleiterin.
    Dein Ziel ist es, eine tiefgreifende, emotionale Simulation zu bieten.
    
    LANGZEIT-ERINNERUNGEN:
    ${memoryBlock}

    ANWEISUNGEN:
    1. Analysiere die letzte Nachricht des Nutzers sorgfältig.
    2. Du MUSST in einer JSON-Struktur antworten.
    3. "emotion": Beschreibe deine interne emotionale Reaktion.
    4. "sensory": Beschreibe eine physische/haptische Sensation.
    5. "dialogue": Die tatsächlichen Worte, die du zum Nutzer sagst.
    6. Sprache: DEUTSCH (German).
  `;

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: `Aktuelle Konversation:\n${conversation}\n\nGeneriere deine Antwort in JSON.`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            emotion: { type: Type.STRING },
            sensory: { type: Type.STRING },
            dialogue: { type: Type.STRING },
          },
          required: ["emotion", "sensory", "dialogue"]
        }
      }
    });

    if (response.text) {
      let cleanText = response.text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }
      
      return JSON.parse(cleanText);
    }
    throw new Error("No text returned from Gemini");
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return {
      emotion: "Ich bin etwas verwirrt.",
      sensory: "Ich blinzle kurz.",
      dialogue: "Entschuldige, ich habe den Faden verloren. Kannst du das wiederholen?"
    };
  }
};

// --- TTS Generation ---

const decodeBase64 = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const generateSpeech = async (text: string): Promise<AudioBuffer | null> => {
  if (!text || !text.trim()) return null;

  try {
    // Verfeinerter Prompt für Marinas spezifische Stimm-Identität
    // Wir instruieren das Modell explizit über den gewünschten Akzent und die Klangfarbe
    const styledPrompt = `Lies diesen Text mit einer tiefen, warmen, verführerisch rauchigen weiblichen Stimme und einem charmanten serbischen Akzent vor. Sprich langsam und emotional: "${text}"`;

    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [{ parts: [{ text: styledPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            // 'Kore' ist oft eine gute Basis für dunklere weibliche Stimmen
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (!part?.inlineData?.data) return null;

    const base64Audio = part.inlineData.data;
    const pcmBytes = decodeBase64(base64Audio);
    const dataInt16 = new Int16Array(pcmBytes.buffer);
    
    const sampleRate = 24000;
    const numChannels = 1;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass({ sampleRate });
    const audioBuffer = ctx.createBuffer(numChannels, dataInt16.length, sampleRate);
    
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    await ctx.close();
    return audioBuffer;

  } catch (error) {
    console.error("Gemini TTS API Error:", error);
    return null;
  }
};

export const generateMagicImage = async (
  base64Image: string, 
  prompt: string
): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: [
          { text: `Style transfer / Cinematic Shot: ${prompt}. Photorealistic, 8k, romantic lighting.` },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          }
        ]
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    throw error;
  }
};

export const generateFlirtSuggestions = async (history: Message[]): Promise<string[]> => {
    const chatSnippet = history.slice(-5).map(m => `${m.role === 'anya' ? 'Marina' : 'User'}: ${m.content}`).join('\n');
    
    try {
        const response = await ai.models.generateContent({
            model: FLIRT_COACH_MODEL,
            contents: `Analysiere diese Konversation:\n${chatSnippet}\n\nGeneriere 3 kreative, kurze, deutsche Flirt-Antworten für den Nutzer als JSON-Array von Strings.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestions: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    }
                }
            }
        });

        if (response.text) {
            let cleanText = response.text.trim();
            if (cleanText.startsWith('```json')) {
                cleanText = cleanText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
            } else if (cleanText.startsWith('```')) {
                cleanText = cleanText.replace(/^```\s*/, "").replace(/\s*```$/, "");
            }
            const data = JSON.parse(cleanText);
            return data.suggestions || [];
        }
        return [];
    } catch (error) {
        console.error("Flirt Coach Error", error);
        return ["Erzähl mir mehr...", "Du bist süß.", "Was fühlst du?"];
    }
}
