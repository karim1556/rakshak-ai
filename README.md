# Rakshak AI - Next-Gen Emergency Intelligence Platform

Rakshak AI is a comprehensive emergency response ecosystem designed to bridge the gap between citizens, emergency dispatchers, and first responders (`Medical`, `Police`, `Fire`). It leverages advanced AI (OpenAI GPT-4o, Real-time Voice), standard protocols (LiveKit), and long-term memory (Mem0) to provide potentially life-saving assistance.

![Rakshak AI BannerPlaceholder](https://placehold.co/1200x400/indigo/white?text=Rakshak+AI)

## 🌟 Key Features

### 🛡️ For Citizens
- **AI Emergency Assistant**: A voice-first AI agent (`Rakshak`) that calms the user, gathers critical info, and automates dispatch.
- **Multilingual Support**: Supports 10+ Indian languages (Hindi, Marathi, Tamil, etc.) with auto-detection.
- **Real-time Guidance**: AI provides immediate, safety-first instructions (CPR, First Aid, Safety protocols) while help is on the way.
- **Health Profile**: Integration with personal health records (Allergies, Blood Group, Conditions) automatically shared with responders.
- **Silent Mode**: Text-based reporting for situations where speaking is dangerous.

### 📡 For Dispatchers (Control Room)
- **Central Command Dashboard**: Real-time view of all active emergencies on a unified map.
- **Live Monitoring**: Listen/Read live transcriptions of citizen-AI conversations as they happen.
- **Resource Management**: Auto-dispatch closest responders or manually assign specific units.
- **Spam Guard**: AI-powered analysis to flag and filter non-emergency or prank calls.

### 🚑 For Responders (Medical / Police / Fire)
- **Dedicated Dashboards**: Role-specific views (e.g., EMS sees patient vitals; Police see incident threat level).
- **Navigation**: Integrated routing to the incident location.
- **Contextual Intelligence**: Receive AI-summarized incident reports and patient health data *before* arriving on scene.

## 🏗️ Tech Stack

- **Framework**: `Next.js 16` (App Router)
- **Language**: `TypeScript`
- **Database & Auth**: `Supabase` (PostgreSQL, Realtime, Auth)
- **AI Core**: `OpenAI GPT-4o` (via Vercel AI SDK)
- **Voice & Real-time**: `LiveKit` (WebRTC), `Web Speech API`
- **Memory**: `Mem0` (User context & session history)
- **Maps**: `Leaflet` / `React-Leaflet`
- **Styling**: `Tailwind CSS`, `ShadCN UI`
- **State**: `Zustand`

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Supabase Project
- OpenAI API Key
- LiveKit Project (for voice features)
- Mem0 API Key (for memory features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/rakshak-ai.git
   cd rakshak-ai
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   Copy the example env file (or create new):
   ```bash
   cp .env.example .env.local
   ```

   Fill in your API keys in `.env.local`:
   ```env
   # OpenAI
   OPENAI_API_KEY=sk-...

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # LiveKit (Voice)
   LIVEKIT_API_KEY=your-key
   LIVEKIT_API_SECRET=your-secret
   NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud

   # Mem0 (Memory)
   MEM0_API_KEY=your-mem0-key
   ```

4. **Database Setup**
   Run the SQL migrations located in `supabase/` folder in your Supabase SQL Editor to set up the schema.

5. **Run the development server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📱 App Routes

| Route | Description |
|-------|-------------|
| `/` | **Home**: Landing page with quick access to Emergency & Login. |
| `/emergency` | **AI Assistant**: Voice-enabled emergency reporting interface. |
| `/citizen` | **Manual Report**: Form-based reporting for citizens. |
| `/dashboard/dispatch` | **Control Room**: Map & list view of all incidents for dispatchers. |
| `/dashboard/medical` | **EMS Dashboard**: Medical incidents and patient data. |
| `/dashboard/police` | **Police Dashboard**: Security incidents and crime reporting. |
| `/dashboard/fire` | **Fire Dashboard**: Fire & Rescue incidents. |
| `/health-profile` | **Profile**: User settings and medical history setup. |

## 🧩 Architecture Highlights

### The Emergency Agent (`/api/emergency-agent`)
The core reasoning engine. It:
1. Receives voice/text input.
2. Analyzes severity and category.
3. Consults `Mem0` for past user context.
4. Generates a safety-first response.
5. Updates the Supabase database in real-time.
6. Triggers `auto-dispatch` if severity is critical.

### Spam Detection (`/api/spam-review`)
A background process that analyzes call patterns and transcripts to identify potential misuse, protecting responder resources.

### Community Alerts (`/api/community-alerts`)
Geolocation-based notifications sent to nearby users when high-priority incidents (e.g., Fire, Active Shooter) are verified.

## 🤝 Contributing

 Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT
