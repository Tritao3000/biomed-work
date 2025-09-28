# AI Chat Assistant

A beautiful Next.js chat application that provides personalized AI responses with multiple answer options. Users can customize the AI's personality and response style, with preferences saved locally.

## Features

- 🎨 Beautiful, modern chat interface built with shadcn/ui
- 🤖 AI-powered responses using Vercel AI SDK and OpenAI
- 🎭 Customizable AI personality with traits, tone, and expertise
- 📝 4 different response options for each question
- 💾 Persistent personality settings using localStorage
- 📱 Responsive design with tabs for chat and settings

## Setup

1. **Install dependencies:**

   ```bash
   bun install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the root directory and add your OpenAI API key:

   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

   Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

3. **Run the development server:**

   ```bash
   bun dev
   ```

4. **Open the application:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Chat Interface

- Type your questions in the chat input
- Receive 4 different response options tailored to your personality settings
- Click on any response option to select it
- View your conversation history with timestamps

### Personality Settings

- Switch to the "Personality" tab to customize the AI
- Set the assistant's name, traits, tone, expertise areas, and response style
- Changes are automatically saved to localStorage
- Reset to defaults anytime

## Technology Stack

- **Framework:** Next.js 15 with App Router
- **UI Components:** shadcn/ui with Tailwind CSS
- **AI:** Vercel AI SDK with OpenAI GPT-4
- **Icons:** Lucide React
- **Storage:** localStorage for persistence
- **Package Manager:** Bun

## Project Structure

```
├── app/
│   ├── api/chat/route.ts    # AI chat API endpoint
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main chat interface
├── components/ui/           # shadcn/ui components
├── lib/utils.ts            # Utility functions
└── package.json
```

## Customization

The AI personality can be customized with:

- **Name:** What to call the assistant
- **Traits:** Personality characteristics (friendly, analytical, etc.)
- **Tone:** Communication style (professional, casual, formal, etc.)
- **Expertise:** Areas of knowledge focus
- **Response Style:** How detailed or creative responses should be

All settings persist across browser sessions using localStorage.
