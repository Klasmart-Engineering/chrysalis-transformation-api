// Ensure environment variables from .env are set before evaluating any references
// by importing this file at the very beginning of the app entry point (main.ts)

// https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '..', '..', '.env');
dotenv.config({ path: envPath });
