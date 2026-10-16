import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { mindAudio } from './services/mindAudio';

// Global unlock for Web Audio API upon first user interaction
const unlockAudioOnGesture = () => {
  mindAudio.unlockAudio();
  window.removeEventListener('pointerdown', unlockAudioOnGesture);
  window.removeEventListener('keydown', unlockAudioOnGesture);
  window.removeEventListener('touchstart', unlockAudioOnGesture);
};

window.addEventListener('pointerdown', unlockAudioOnGesture, { once: true });
window.addEventListener('keydown', unlockAudioOnGesture, { once: true });
window.addEventListener('touchstart', unlockAudioOnGesture, { once: true });

createRoot(document.getElementById('root')!).render(<App />);
