// ===== REACTION TYPES =====
export const REACTIONS = [
  { key: 'like', emoji: '👍', label: 'Like', color: '#0a66c2' },
  { key: 'love', emoji: '❤️', label: 'Love', color: '#df4f60' },
  { key: 'support', emoji: '👏', label: 'Support', color: '#6dae4f' },
  { key: 'care', emoji: '🤗', label: 'Care', color: '#eaaa30' },
  { key: 'brilliant', emoji: '💡', label: 'Brilliant', color: '#f5c400' },
  { key: 'fire', emoji: '🔥', label: 'Fire', color: '#e16745' },
  { key: 'genius', emoji: '🧠', label: 'Genius', color: '#9b59b6' },
];

// ===== AVATARS (SVG-based science-themed) =====
export const AVATARS = [
  { id: 'av1', svg: '🧬', label: 'DNA Explorer', bg: '#dbeafe' },
  { id: 'av2', svg: '🔬', label: 'Microscope Master', bg: '#fce7f3' },
  { id: 'av3', svg: '🧪', label: 'Lab Enthusiast', bg: '#d1fae5' },
  { id: 'av4', svg: '⚗️', label: 'Chemistry Wizard', bg: '#fef3c7' },
  { id: 'av5', svg: '🧫', label: 'Petri Dish Pro', bg: '#ede9fe' },
  { id: 'av6', svg: '🦠', label: 'Micro Hunter', bg: '#ccfbf1' },
  { id: 'av7', svg: '🌡️', label: 'Temperature Tamer', bg: '#fee2e2' },
  { id: 'av8', svg: '🧲', label: 'Magnetic Mind', bg: '#e0e7ff' },
  { id: 'av9', svg: '🔭', label: 'Star Gazer', bg: '#1e1b4b', textColor: '#fff' },
  { id: 'av10', svg: '🪐', label: 'Cosmic Soul', bg: '#312e81', textColor: '#fff' },
  { id: 'av11', svg: '🧑‍🔬', label: 'Scientist', bg: '#ecfdf5' },
  { id: 'av12', svg: '🧑‍🏫', label: 'Educator', bg: '#fff7ed' },
  { id: 'av13', svg: '🎙️', label: 'Speaker', bg: '#fef2f2' },
  { id: 'av14', svg: '📡', label: 'Broadcaster', bg: '#f0f9ff' },
  { id: 'av15', svg: '🧠', label: 'Big Brain', bg: '#fdf4ff' },
  { id: 'av16', svg: '🚀', label: 'Rocket Scientist', bg: '#0f172a', textColor: '#fff' },
  { id: 'av17', svg: '⚛️', label: 'Atomic', bg: '#dbeafe' },
  { id: 'av18', svg: '🌍', label: 'Global Thinker', bg: '#dcfce7' },
  { id: 'av19', svg: '💻', label: 'Tech Savvy', bg: '#f1f5f9' },
  { id: 'av20', svg: '🎓', label: 'Academic', bg: '#fefce8' },
];

// ===== AUTO-ACHIEVEMENT TAGS =====
// { threshold: minimum score to unlock, tag: display name }
export const AUTO_TAGS = [
  { threshold: 50, tag: '🧬 PCR Addict' },
  { threshold: 100, tag: '🧫 Cell Division Survivor' },
  { threshold: 150, tag: '☕ Caffeine Catalyst' },
  { threshold: 220, tag: '⚛️ Periodic Table Menace' },
  { threshold: 300, tag: '🌌 Quantum Confused' },
  { threshold: 400, tag: '☣️ Biohazard Baby' },
  { threshold: 550, tag: '🔬 Microscopy Maniac' },
  { threshold: 750, tag: '🏅 Nobel? Maybe.' },
  { threshold: 1000, tag: '👻 Lab Coat Ghost' },
  { threshold: 1300, tag: '🧟 Data Zombie' },
  { threshold: 1700, tag: '🧠 Neuron on Fire' },
  { threshold: 2200, tag: '⏳ Mutation Loading' },
  { threshold: 2800, tag: '👺 Citation Goblin' },
  { threshold: 3500, tag: '🍎 Gravity Denier' },
];

// ===== SCORE CALCULATOR =====
export function calculateScore({ completedTasks = 0, likesReceived = 0, meetingsAttended = 0, tagsCount = 0, connectionCount = 0, reputationBonus = 0 }) {
  return (completedTasks * 25) + (likesReceived * 5) + (meetingsAttended * 15) + (tagsCount * 15) + (connectionCount * 2) + reputationBonus;
}

export function getUnlockedTags(score) {
  return AUTO_TAGS.filter(t => score >= t.threshold).map(t => t.tag);
}

export function getNextTag(score) {
  return AUTO_TAGS.find(t => t.threshold > score) || null;
}

// ===== SPAM DETECTION =====
export function isSpamPost(content, recentPosts) {
  if (!content || content.trim().length < 10) return true;
  // Check for repetitive content in last 5 posts
  const recent = recentPosts.slice(0, 5);
  for (const p of recent) {
    if (p.content === content) return true;
    // Similarity check (same first 20 chars)
    if (p.content.substring(0, 20) === content.substring(0, 20)) return true;
  }
  return false;
}

// ===== TIME HELPERS =====
export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  return new Date(dateStr).toLocaleDateString();
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
