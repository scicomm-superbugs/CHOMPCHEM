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
  { threshold: 0, tag: '🔰 Rookie Researcher' },
  { threshold: 25, tag: '🧫 Petri Dish Starter' },
  { threshold: 50, tag: '🔬 Microscopic Mind' },
  { threshold: 80, tag: '🧪 Lab Rat' },
  { threshold: 120, tag: '📢 Outreach Rookie' },
  { threshold: 160, tag: '📝 Science Scribbler' },
  { threshold: 200, tag: '💡 Bright Spark' },
  { threshold: 250, tag: '📊 Data Diver' },
  { threshold: 300, tag: '🎙️ Mic Dropper' },
  { threshold: 350, tag: '🧬 Gene Genius' },
  { threshold: 400, tag: '😂 Science Meme Lord' },
  { threshold: 460, tag: '🌌 Cosmic Explainer' },
  { threshold: 520, tag: '📖 Citation Hunter' },
  { threshold: 580, tag: '🏅 PCR Prophet' },
  { threshold: 650, tag: '⚗️ Alchemy Apprentice' },
  { threshold: 720, tag: '🎯 Precision Expert' },
  { threshold: 800, tag: '🤝 Collaboration Champion' },
  { threshold: 880, tag: '🎥 Visual Storyteller' },
  { threshold: 960, tag: '📡 Science Broadcaster' },
  { threshold: 1050, tag: '🛡️ Fact Checker Supreme' },
  { threshold: 1150, tag: '🧑‍🔬 Peer Review Survivor' },
  { threshold: 1250, tag: '🏗️ Event Architect' },
  { threshold: 1360, tag: '📣 Social Media Slayer' },
  { threshold: 1480, tag: '🌱 Sustainability Sage' },
  { threshold: 1600, tag: '🤓 Trivia Titan' },
  { threshold: 1730, tag: '🧲 Engagement Magnet' },
  { threshold: 1870, tag: '🪄 Outreach Wizard' },
  { threshold: 2020, tag: '🔊 Voice of Reason' },
  { threshold: 2180, tag: '🗺️ Science Explorer' },
  { threshold: 2350, tag: '🧠 Critical Thinker' },
  { threshold: 2530, tag: '🎨 Creative Genius' },
  { threshold: 2720, tag: '📐 Quantum Chatterbox' },
  { threshold: 2920, tag: '🩺 Health Communicator' },
  { threshold: 3130, tag: '🎬 SciComm Filmmaker' },
  { threshold: 3350, tag: '🏆 Award Winner' },
  { threshold: 3580, tag: '🎭 Science Performer' },
  { threshold: 3820, tag: '🧑‍🏫 Mentor of the Year' },
  { threshold: 4070, tag: '🌐 Digital Pioneer' },
  { threshold: 4330, tag: '🦸 SciComm Superhero' },
  { threshold: 4600, tag: '☣️ Biohazard Brain' },
  { threshold: 4880, tag: '🚀 Rising Star' },
  { threshold: 5170, tag: '📍 Community Leader' },
  { threshold: 5470, tag: '💎 Diamond Member' },
  { threshold: 5780, tag: '👑 Science Royalty' },
  { threshold: 6100, tag: '🏛️ SciComm Legend' },
  { threshold: 6430, tag: '🌟 Science Titan' },
  { threshold: 6770, tag: '🎖️ Nobel-ish Candidate' },
  { threshold: 7120, tag: '🔮 Oracle of Science' },
  { threshold: 7480, tag: '⭐ Constellation Class' },
  { threshold: 8000, tag: '🌠 Immortal Contributor' },
];

// ===== RANK PROGRESSION =====
export const RANKS = [
  { minScore: 0, rank: 'Intern', color: '#94a3b8', icon: '🔰' },
  { minScore: 100, rank: 'Junior Member', color: '#60a5fa', icon: '🔵' },
  { minScore: 300, rank: 'Member', color: '#34d399', icon: '🟢' },
  { minScore: 600, rank: 'Senior Member', color: '#a78bfa', icon: '🟣' },
  { minScore: 1000, rank: 'Lead Communicator', color: '#f59e0b', icon: '🟡' },
  { minScore: 1500, rank: 'Expert', color: '#f97316', icon: '🟠' },
  { minScore: 2500, rank: 'Master Communicator', color: '#ef4444', icon: '🔴' },
  { minScore: 4000, rank: 'Elite', color: '#ec4899', icon: '💎' },
  { minScore: 6000, rank: 'Legend', color: '#8b5cf6', icon: '👑' },
  { minScore: 8000, rank: 'Immortal', color: '#fbbf24', icon: '🌟' },
];

// ===== SCORE CALCULATOR =====
export function calculateScore({ completedTasks = 0, likesReceived = 0, meetingsAttended = 0, tagsCount = 0, connectionCount = 0, reputationBonus = 0 }) {
  return (completedTasks * 25) + (likesReceived * 5) + (meetingsAttended * 15) + (tagsCount * 15) + (connectionCount * 2) + reputationBonus;
}

export function getRank(score) {
  let current = RANKS[0];
  for (const r of RANKS) {
    if (score >= r.minScore) current = r;
  }
  return current;
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
