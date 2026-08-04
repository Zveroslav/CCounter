import * as cp from 'child_process';
import { z } from 'zod';

const CLI_TIMEOUT_MS = 60_000; // 60 seconds

/** Wraps cp.exec with a hard timeout and detailed error logging. */
function execWithTimeout(command: string, timeoutMs = CLI_TIMEOUT_MS): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = cp.exec(command, { timeout: timeoutMs }, (err, stdout, stderr) => {
      if (err) {
        const isTimeout = err.killed || (err as any).signal === 'SIGTERM';
        console.error(`[agy] CLI ${isTimeout ? 'TIMED OUT' : 'FAILED'} after ${timeoutMs}ms`);
        console.error(`[agy] stderr: ${stderr?.trim() || '(empty)'}`);
        console.error(`[agy] stdout: ${stdout?.trim() || '(empty)'}`);
        console.error(`[agy] error:`, err.message);
        return reject(
          isTimeout
            ? new Error(`AI request timed out after ${timeoutMs / 1000}s. Try again later.`)
            : new Error(`AI CLI failed: ${stderr?.trim() || err.message}`)
        );
      }
      resolve({ stdout, stderr });
    });

    // Belt-and-suspenders: make sure the process is killed even if cp.exec's own timeout fires late
    setTimeout(() => child.kill('SIGTERM'), timeoutMs);
  });
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const MealRecognitionSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  calories: z.number().transform(Math.round),
  protein: z.number().transform(Math.round),
  carbs: z.number().transform(Math.round),
  fat: z.number().transform(Math.round),
});

export type MealRecognitionResult = z.infer<typeof MealRecognitionSchema>;

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export const recognizeMealFromImage = async (imagePath: string, customPrompt?: string): Promise<MealRecognitionResult> => {
  const template = process.env.CLI_COMMAND_TEMPLATE;
  const basePrompt = process.env.AI_SYSTEM_PROMPT || 'Analyze this meal';
  const prompt = customPrompt
    ? `${basePrompt}. Additional user instructions/clarification: ${customPrompt}`
    : basePrompt;

  if (!template) {
    throw new Error('CLI_COMMAND_TEMPLATE is not set in environment variables');
  }

  const escapedPrompt = prompt.replace(/'/g, "'\\''");
  const escapedImagePath = imagePath.replace(/'/g, "'\\''");

  const command = template
    .replace('{{PROMPT}}', () => escapedPrompt)
    .replace('{{IMAGE_PATH}}', () => escapedImagePath);

  try {
    console.log('[agy] recognizeMeal: executing...');
    const { stdout, stderr } = await execWithTimeout(command);

    if (stderr && !stdout) console.warn('[agy] recognizeMeal stderr:', stderr);

    let jsonString = stdout.trim();
    try {
      const agyParsed = JSON.parse(jsonString);
      if (agyParsed?.response) jsonString = agyParsed.response;
    } catch (_) { /* raw text fallback */ }

    const jsonMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) jsonString = jsonMatch[1];

    return MealRecognitionSchema.parse(JSON.parse(jsonString));
  } catch (error) {
    console.error('[agy] recognizeMeal failed:', error);
    throw error;
  }
};

export const getDailyFeedback = async (
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
): Promise<string> => {
  const promptTemplate = process.env.AI_DAILY_PROMPT;
  if (!promptTemplate) return 'Daily summary recorded.';

  const agyBin = process.env.AGY_PATH || 'agy';
  const prompt = promptTemplate
    .replace('{{CALORIES}}', calories.toString())
    .replace('{{PROTEIN}}', protein.toString())
    .replace('{{CARBS}}', carbs.toString())
    .replace('{{FAT}}', fat.toString());

  const command = `${agyBin} --dangerously-skip-permissions --print '${prompt}' --output-format json`;

  try {
    console.log('[agy] getDailyFeedback: executing...');
    const { stdout } = await execWithTimeout(command);
    let jsonString = stdout.trim();
    try {
      const agyParsed = JSON.parse(jsonString);
      if (agyParsed?.response) return agyParsed.response;
    } catch (_) { /* raw text fallback */ }
    return jsonString;
  } catch (error) {
    console.error('[agy] getDailyFeedback failed:', error);
    return `Could not generate feedback: ${(error as Error).message}`;
  }
};

export const chatWithNutritionist = async (prompt: string): Promise<string> => {
  const agyBin = process.env.AGY_PATH || 'agy';
  const escapedPrompt = prompt.replace(/'/g, "'\\''");
  const command = `${agyBin} --dangerously-skip-permissions --print '${escapedPrompt}' --output-format json`;

  try {
    console.log('[agy] chatWithNutritionist: executing...');
    const { stdout } = await execWithTimeout(command);
    let jsonString = stdout.trim();
    try {
      const agyParsed = JSON.parse(jsonString);
      if (agyParsed?.response) return agyParsed.response;
    } catch (_) { /* raw text fallback */ }
    return jsonString;
  } catch (error) {
    console.error('[agy] chatWithNutritionist failed:', error);
    throw error; // re-throw — HTTP handler вернёт 500 с реальным сообщением
  }
};
