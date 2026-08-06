import * as cp from 'child_process';
import { z } from 'zod';
import { AppError } from '../middleware/error';

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
  health_warnings: z.string().optional(),
});

export type MealRecognitionResult = z.infer<typeof MealRecognitionSchema>;

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export const recognizeMealFromImage = async (imagePath: string, customPrompt?: string): Promise<MealRecognitionResult> => {
  const agyBin = process.env.AGY_PATH || 'agy';
  const basePrompt = "Analyze the image. If it's a prepared meal, identify it and estimate the calories, protein, carbs, and fat. If it's food packaging, read the nutritional value from the label. Return only JSON with the following fields: title (short name of the meal/product), description (detailed description and any relevant health warnings or notes), calories (number), protein (number), carbs (number), fat (number).";
  const prompt = customPrompt
    ? `${basePrompt}. Additional user instructions/clarification: ${customPrompt}`
    : basePrompt;

  const escapedPrompt = prompt.replace(/'/g, "'\\''");
  const escapedImagePath = imagePath.replace(/'/g, "'\\''");

  const command = `${agyBin} --dangerously-skip-permissions --print '${escapedPrompt} The image is located at: ${escapedImagePath}' --output-format json`;

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
  const agyBin = process.env.AGY_PATH || 'agy';
  const prompt = `Generate a short but useful comment based on the daily data: Calories: ${Math.round(calories)}, Protein: ${Math.round(protein)}g, Fat: ${Math.round(fat)}g, Carbs: ${Math.round(carbs)}g. Take into account the macronutrient balance. Give a small piece of advice. Return only a text response (without JSON).`;

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

export const getWeeklyFeedback = async (
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
  startWeight?: number,
  endWeight?: number
): Promise<string> => {
  const agyBin = process.env.AGY_PATH || 'agy';
  
  let weightText = '';
  if (startWeight !== undefined && endWeight !== undefined) {
    const diff = endWeight - startWeight;
    if (diff > 0) weightText = `Weight changed from ${startWeight} to ${endWeight} (+${diff.toFixed(1)}kg).`;
    else if (diff < 0) weightText = `Weight changed from ${startWeight} to ${endWeight} (${diff.toFixed(1)}kg).`;
    else weightText = `Weight didn't change (${startWeight}kg).`;
  }

  const prompt = `Generate a maximally short and concise weekly comment based on the data: Calories: ${Math.round(calories)}, Protein: ${Math.round(protein)}g, Fat: ${Math.round(fat)}g, Carbs: ${Math.round(carbs)}g. ${weightText} Give a short evaluation of the week. Return only a text response (without JSON).`;
  const command = `${agyBin} --dangerously-skip-permissions --print '${prompt}' --output-format json`;

  try {
    const { stdout } = await execWithTimeout(command);
    let jsonString = stdout.trim();
    try {
      const agyParsed = JSON.parse(jsonString);
      if (agyParsed?.response) return agyParsed.response;
    } catch (_) { }
    return jsonString;
  } catch (error) {
    return `Could not generate feedback: ${(error as Error).message}`;
  }
};

export const getMonthlyFeedback = async (
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
  startWeight?: number,
  endWeight?: number
): Promise<string> => {
  const agyBin = process.env.AGY_PATH || 'agy';
  
  let weightText = '';
  if (startWeight !== undefined && endWeight !== undefined) {
    const diff = endWeight - startWeight;
    if (diff > 0) weightText = `Weight changed from ${startWeight} to ${endWeight} (+${diff.toFixed(1)}kg).`;
    else if (diff < 0) weightText = `Weight changed from ${startWeight} to ${endWeight} (${diff.toFixed(1)}kg).`;
    else weightText = `Weight didn't change (${startWeight}kg).`;
  }

  const prompt = `Generate a maximally short and concise monthly comment based on the data: Calories: ${Math.round(calories)}, Protein: ${Math.round(protein)}g, Fat: ${Math.round(fat)}g, Carbs: ${Math.round(carbs)}g. ${weightText} Give a short evaluation of the month. Return only a text response (without JSON).`;
  const command = `${agyBin} --dangerously-skip-permissions --print '${prompt}' --output-format json`;

  try {
    const { stdout } = await execWithTimeout(command);
    let jsonString = stdout.trim();
    try {
      const agyParsed = JSON.parse(jsonString);
      if (agyParsed?.response) return agyParsed.response;
    } catch (_) { }
    return jsonString;
  } catch (error) {
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
    throw new AppError('AI service is temporarily unavailable or returned an error. Please try again.', 503);
  }
};
