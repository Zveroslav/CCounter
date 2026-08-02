import * as cp from 'child_process';
import { z } from 'zod';

export const MealRecognitionSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  health_warnings: z.string().optional(),
});

export type MealRecognitionResult = z.infer<typeof MealRecognitionSchema>;

export const recognizeMealFromImage = async (imagePath: string): Promise<MealRecognitionResult> => {
  const template = process.env.CLI_COMMAND_TEMPLATE;
  const prompt = process.env.AI_SYSTEM_PROMPT || 'Analyze this meal';

  if (!template) {
    throw new Error('CLI_COMMAND_TEMPLATE is not set in environment variables');
  }

  // Replace placeholders in the command template
  let command = template
    .replace('{{PROMPT}}', prompt)
    .replace('{{IMAGE_PATH}}', imagePath);

  try {
    console.log('Executing command:', command);
    const result_exec: any = await new Promise((resolve, reject) => {
      cp.exec(command, (err, stdout, stderr) => {
        if (err) return reject(err);
        resolve({ stdout, stderr });
      });
    });
    console.log('Exec result:', result_exec);
    
    // Check if result_exec is a string (stdout) or an object
    const stdout = typeof result_exec === 'string' ? result_exec : (result_exec as any).stdout;
    const stderr = typeof result_exec === 'string' ? '' : (result_exec as any).stderr;

    if (stderr && !stdout) {
      console.warn('CLI stderr:', stderr);
    }

    let jsonString = stdout.trim();
    try {
      // If the output is the agy JSON wrapper, extract the actual response string
      const agyParsed = JSON.parse(jsonString);
      if (agyParsed && agyParsed.response) {
        jsonString = agyParsed.response;
      }
    } catch (e) {
      // Ignore parsing errors, it might just be the raw text
    }

    const jsonMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonString = jsonMatch[1];
    }

    const parsedJson = JSON.parse(jsonString);
    const result = MealRecognitionSchema.parse(parsedJson);
    return result;
  } catch (error) {
    console.error('Failed to recognize meal:', error);
    throw new Error('Meal recognition failed');
  }
};
