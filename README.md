# 🗨️ Chatterbox | Premium Messaging Experience

Chatterbox is a high-fidelity, real-time messaging application engineered for speed, security, and a luxury user experience. Built with a modern tech stack to bridge the gap between web and native performance.

## 🚀 Recent Updates: The Reply Engine
We've just rolled out our advanced **Reply System**.
- **Contextual Threading:** Quote any message to keep conversations organized.
- **Smart Media Labels:** Intelligent labeling for photo/video replies.
- **Swipe-to-Reply:** Native mobile gestures (Instagram/Snapchat style) for instant interaction.

---

## ✨ Cutting-Edge Features

- **💎 Elite Design System:** A meticulously crafted dark mode with glassmorphism, vibrant gradients, and fluid Framer Motion animations.
- **⚡ Zero-Lag Realtime:** Powered by Supabase Realtime with surgical state updates for instant message delivery.
- **🎙️ Studio-Quality Voice Notes:** High-fidelity recording with dynamic waveform visualization.
- **🎨 Ultimate Personalization:**
  - **Dynamic Wallpapers:** Intelligent background management with IndexedDB caching.
  - **Custom Color Palettes:** Vibrant chat bubble customization.
- **📸 Intelligent Media Handling:** Direct-to-bucket uploads with client-side compression and instant previews.
- **🔒 Privacy First:** Ephemeral (disappearing) messages, sanitized inputs, and multi-layer security audit repairs.
- **📱 Native Hybrid Architecture:** Full Android support via Capacitor with a true native feel.

---

## 🛠️ Performance Tech Stack

Chatterbox uses a state-of-the-art stack for maximum responsiveness:

- **Frontend:** [React 18](https://reactjs.org/) + [Vite](https://vitejs.dev/) (Lightning fast builds)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Precision UI)
- **Logic:** Custom React Hooks + [TanStack Query](https://tanstack.com/query)
- **Backend:** [Supabase](https://supabase.com/) (Enterprise-grade Auth, DB, and Realtime)
- **Animations:** [Framer Motion](https://www.framer.com/motion/) (60fps interactions)
- **Mobile:** [Capacitor](https://capacitorjs.com/) (Cross-platform native bridge)

---

## 📦 Getting Started

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **Supabase Account:** For database and authentication
- **Android Studio:** (Optional) For mobile deployments

### Installation & Setup

1. **Clone the Source:**
   ```bash
   git clone https://github.com/ashishnotfound/chatterboxx.git
   cd chatterboxx
   ```

2. **Install Engine Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Launch Dev Environment:**
   ```bash
   npm run dev
   ```

---

## 🛡️ Security Audit
This repository has undergone a comprehensive security hardening process:
- **RLS Hardened:** Every table is protected by fine-grained Row Level Security.
- **Payload Sanitization:** Protection against XSS and injection.
- **Trigger-Based Protection:** Database-level integrity checks for friendship and chat ownership.

---

## 📜 License
Architected under the **MIT License**.

<p align="center">
  Crafted with passion for the next generation of communication.
</p>
