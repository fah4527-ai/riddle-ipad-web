# Riddle Diary for iPad

A deploy-ready browser version of the Riddle diary idea. It runs in Safari on iPad, accepts Apple Pencil Scribble or typed text, sends the prompt through a server-side DeepSeek API call, and animates the answer back onto the page.

## Local preview

```bash
cp .env.example .env
# Fill DEEPSEEK_API_KEY in .env, or set it in your shell.
npm run dev
```

Open `http://localhost:3000`.

## Deploy on Vercel

1. Push this folder to GitHub.
2. Import the project in Vercel.
3. Add these Environment Variables:
   - `DEEPSEEK_API_KEY`: your DeepSeek API key
   - `DEEPSEEK_MODEL`: `deepseek-v4-flash`
   - `SYSTEM_PROMPT`: optional diary personality
4. Deploy.
5. Open the Vercel URL on iPad Safari.
6. Tap Share -> Add to Home Screen.

## Notes

- Keep `DEEPSEEK_API_KEY` server-side only. Never put it in browser JavaScript.
- The canvas preserves the writing feel, while the text box lets iPadOS Scribble convert Apple Pencil handwriting into text reliably.
- DeepSeek's API is OpenAI-compatible at `https://api.deepseek.com/chat/completions`.
