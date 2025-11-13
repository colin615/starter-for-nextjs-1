// Helper function to format dollar amounts with max 2 decimals (round down)
export const formatDollarAmount = (amount) => {
  return Math.floor(amount * 100) / 100;
};

// Helper function to format lastSeen timestamp as relative time
export const formatLastSeen = (lastSeenStr) => {
  if (!lastSeenStr) return 'Long time ago';
  
  try {
    const lastSeenDate = new Date(lastSeenStr);
    const now = new Date();
    const diffMs = now - lastSeenDate;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  } catch (e) {
    console.error('Error formatting lastSeen:', e);
    return 'Long time ago';
  }
};

// Helper function to get service provider icon
export const getServiceIcon = (service) => {
  if (!service) return null;
  
  const serviceLower = service.toLowerCase();
  
  const serviceIcons = {
    'roobet': '/casinos/roobet.svg',
    'stake': '/casinos/stake.svg',
    'shuffle': '/casinos/shuffle.svg',
    'gamdom': '/casinos/gamdom.svg',
    'rustclash': '/casinos/rustclash.svg',
    'rain': '/casinos/rain.svg'
  };
  
  return serviceIcons[serviceLower] || null;
};

// Generate avatar URL using DiceBear with Adventurer Neutral style and maximum randomness
export const getAvatarUrl = (userId) => {
  const { createAvatar } = require('@dicebear/core');
  const { adventurerNeutral } = require('@dicebear/collection');

  // Create a hash from userId for consistent random values
  const hashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  const hash = hashCode(userId);
  
  // Bold color set for backgrounds (solid colors, no gradients)
  const backgroundColors = [
    'FF6B6B', // Bright red
    '4ECDC4', // Turquoise
    '45B7D1', // Sky blue
    'FFA07A', // Light salmon
    '98D8C8', // Mint green
    'F7DC6F', // Bright yellow
    'BB8FCE', // Light purple
    '85C1E2', // Light blue
    'F8C471', // Peach
    '82E0AA', // Light green
    'F1948A', // Salmon pink
    'AED6F1', // Powder blue
    'D2B4DE', // Lavender
    'F9E79F', // Pale yellow
    '76D7C4', // Aqua
    'E8DAEF', // Light lilac
    'FAD7A0', // Apricot
    'D5DBDB', // Light gray
    'F5B7B1', // Rose
    'AED6F1', // Powder blue
    'A3E4D7', // Light cyan
    'F9E79F', // Cream
    'D5DBDB', // Silver
    'F1C40F', // Golden yellow
    'E74C3C', // Bright red
    '3498DB', // Bright blue
    '2ECC71', // Emerald green
    '9B59B6', // Purple
    'F39C12', // Orange
    '1ABC9C', // Turquoise
  ];

  // Select random bold background color
  const bgColor = backgroundColors[hash % backgroundColors.length];

  const avatar = createAvatar(adventurerNeutral, {
    seed: userId,
    size: 128,
    scale: 90 + (hash % 21), // 90-110
    radius: 0,
    backgroundColor: [bgColor],
    clip: false,
    randomizeIds: true,
    glassesProbability: 20, // 20% chance of glasses
  });
  return avatar.toDataUri();
};

// Fun microcopy generator for user counts with correlated emojis
export const getUserCountMicrocopy = (count) => {
  const microcopy = [
    { min: 1, max: 9, items: [
      { text: "That's a small team!", emoji: "👥" },
      { text: "Cozy group size!", emoji: "🏠" },
      { text: "Just getting started!", emoji: "🌱" },
      { text: "Small but mighty!", emoji: "💪" },
      { text: "Building momentum!", emoji: "🚀" }
    ]},
    { min: 10, max: 19, items: [
      { text: "That's more than a soccer team!", emoji: "⚽" },
      { text: "Bigger than a jury!", emoji: "⚖️" },
      { text: "More people than fit in a small elevator!", emoji: "🛗" },
      { text: "That's a solid group!", emoji: "👨‍👩‍👧‍👦" },
      { text: "Growing strong!", emoji: "📈" }
    ]},
    { min: 20, max: 29, items: [
      { text: "That's more than a classroom!", emoji: "🎓" },
      { text: "Bigger than a wedding party!", emoji: "💒" },
      { text: "More than a full bus!", emoji: "🚌" },
      { text: "That's a small town meeting!", emoji: "🏛️" },
      { text: "Growing community!", emoji: "🌱" }
    ]},
    { min: 30, max: 39, items: [
      { text: "That's more than a baseball team!", emoji: "⚾" },
      { text: "Bigger than a jury pool!", emoji: "👥" },
      { text: "More people than a small restaurant!", emoji: "🍽️" },
      { text: "That's a full classroom!", emoji: "🏫" },
      { text: "Strong community!", emoji: "💪" }
    ]},
    { min: 40, max: 49, items: [
      { text: "That's more than a wedding party!", emoji: "💒" },
      { text: "Bigger than a small bus!", emoji: "🚌" },
      { text: "More people than a family reunion!", emoji: "👨‍👩‍👧‍👦" },
      { text: "That's a solid gathering!", emoji: "🎉" },
      { text: "Impressive turnout!", emoji: "🎯" }
    ]},
    { min: 50, max: 59, items: [
      { text: "That's more than a school bus!", emoji: "🚌" },
      { text: "Bigger than a small conference!", emoji: "🏢" },
      { text: "More people than a wedding!", emoji: "💒" },
      { text: "That's a full train car!", emoji: "🚃" },
      { text: "Amazing community!", emoji: "🎉" }
    ]},
    { min: 60, max: 69, items: [
      { text: "That's more than a full bus!", emoji: "🚌" },
      { text: "Bigger than a small theater!", emoji: "🎭" },
      { text: "More people than a restaurant!", emoji: "🍽️" },
      { text: "That's a good crowd!", emoji: "👥" },
      { text: "Fantastic growth!", emoji: "🎊" }
    ]},
    { min: 70, max: 79, items: [
      { text: "That's more than a train carriage!", emoji: "🚃" },
      { text: "Bigger than a small wedding!", emoji: "💒" },
      { text: "More people than a full elevator!", emoji: "🛗" },
      { text: "That's a packed room!", emoji: "🏠" },
      { text: "Incredible community!", emoji: "🎯" }
    ]},
    { min: 80, max: 89, items: [
      { text: "That's more than a full train car!", emoji: "🚃" },
      { text: "Bigger than a small theater!", emoji: "🎭" },
      { text: "More people than a wedding hall!", emoji: "🏛️" },
      { text: "That's a packed venue!", emoji: "🏟️" },
      { text: "Outstanding turnout!", emoji: "🎉" }
    ]},
    { min: 90, max: 99, items: [
      { text: "That's almost 100 people!", emoji: "💯" },
      { text: "Bigger than a large wedding!", emoji: "💒" },
      { text: "More people than a small concert!", emoji: "🎵" },
      { text: "That's a packed house!", emoji: "🏠" },
      { text: "Amazing community!", emoji: "🎊" }
    ]},
    { min: 100, max: 999, items: [
      { text: "That's more than a small concert!", emoji: "🎵" },
      { text: "Bigger than a wedding hall!", emoji: "🏛️" },
      { text: "More people than a theater!", emoji: "🎭" },
      { text: "That's a full auditorium!", emoji: "🏛️" },
      { text: "Incredible community!", emoji: "🎯" },
      { text: "That's more than a small festival!", emoji: "🎪" },
      { text: "Bigger than a conference!", emoji: "🏢" },
      { text: "More people than a stadium section!", emoji: "🏟️" }
    ]},
    { min: 1000, max: 9999, items: [
      { text: "That's more than a small festival!", emoji: "🎪" },
      { text: "Bigger than a concert venue!", emoji: "🎵" },
      { text: "More people than a stadium section!", emoji: "🏟️" },
      { text: "That's a full arena!", emoji: "🏟️" },
      { text: "Massive community!", emoji: "🌍" },
      { text: "That's more than a small town!", emoji: "🏘️" },
      { text: "Bigger than a university!", emoji: "🏫" },
      { text: "More people than a city block!", emoji: "🏙️" }
    ]},
    { min: 10000, max: 99999, items: [
      { text: "That's more than a small town!", emoji: "🏘️" },
      { text: "Bigger than a university!", emoji: "🏫" },
      { text: "More people than a city district!", emoji: "🏙️" },
      { text: "That's a full stadium!", emoji: "🏟️" },
      { text: "Massive community!", emoji: "🌍" },
      { text: "That's more than a small city!", emoji: "🏙️" },
      { text: "Bigger than a major venue!", emoji: "🎪" },
      { text: "More people than a large festival!", emoji: "🎪" }
    ]},
    { min: 100000, max: 999999, items: [
      { text: "That's more than a small city!", emoji: "🏙️" },
      { text: "Bigger than a major stadium!", emoji: "🏟️" },
      { text: "More people than a large festival!", emoji: "🎪" },
      { text: "That's a massive gathering!", emoji: "👥" },
      { text: "Incredible community!", emoji: "🎯" },
      { text: "That's more than a medium city!", emoji: "🏙️" },
      { text: "Bigger than a major event!", emoji: "🎪" },
      { text: "More people than a whole district!", emoji: "🏙️" }
    ]},
    { min: 1000000, max: Infinity, items: [
      { text: "That's more than a major city!", emoji: "🌍" },
      { text: "Bigger than a whole state!", emoji: "🗺️" },
      { text: "More people than a country!", emoji: "🌎" },
      { text: "That's a global community!", emoji: "🌍" },
      { text: "Unbelievable scale!", emoji: "🚀" },
      { text: "That's more than a continent!", emoji: "🌍" },
      { text: "Bigger than a planet!", emoji: "🪐" },
      { text: "More people than the universe!", emoji: "🌌" }
    ]}
  ];

  const range = microcopy.find(r => count >= r.min && count <= r.max);
  if (range) {
    const randomIndex = Math.floor(Math.random() * range.items.length);
    return range.items[randomIndex];
  }
  
  return { text: "That's quite a community!", emoji: "👥" };
};

