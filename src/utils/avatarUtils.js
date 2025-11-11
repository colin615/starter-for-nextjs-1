// Avatar utility functions for leaderboard avatars

/**
 * Create a hash from a string for consistent random values
 */
const hashCode = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

/**
 * Get avatar URL from Supabase storage bucket "Avatars"
 * Uses user name/ID as seed to deterministically select one of the available slot images
 */
export const getSupabaseAvatarUrl = (userId, username) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.warn("Supabase URL not configured");
    return null;
  }

  // Combine username and userId for better distribution and fewer collisions
  // Use both if available, otherwise fall back to what's available
  const seed = username && userId 
    ? `${username}:${userId}` 
    : username || userId || "default";
  const hash = hashCode("10+"+seed + "9");
  
  // List of available slot images
  const slotImages = [
    "slot_gaelic.png",
    "slot_gates.png",
    "slot_hoarder.png",
    "slot_immortal.png",
    "slot_ironbank.png",
    "slot_jokerbombs.png",
    "slot_lebandit.png",
    "slot_magicpiggy.png",
    "slot_mokn.png",
    "slot_punkrocker2.png",
    "slot_razorshark.png",
    "slot_ripcity.png",
    "slot_sanquentin.png",
    "slot_shadows.png",
    "slot_starlight.png",
    "slot_thecrypt.png",
    "slot_therave.png",
    "slot_wildpanda.png",
    "slot_wildwest.png",
    "slot_xmasdrop.png",
  ];
  
  // Select one image deterministically based on hash
  const imageIndex = hash % slotImages.length;
  const imageName = slotImages[imageIndex];
  
  // Construct public URL for Supabase storage
  return `${supabaseUrl}/storage/v1/object/public/slot-avatars/${imageName}`;
};

/**
 * Shared function to generate DiceBear avatar with a specific style
 */
const generateDiceBearAvatar = (style, userId) => {
  const hash = hashCode(userId);
  
  const backgroundColors = [
    'FF6B6B', '4ECDC4', '45B7D1', 'FFA07A', '98D8C8', 'F7DC6F', 'BB8FCE', '85C1E2',
    'F8C471', '82E0AA', 'F1948A', 'AED6F1', 'D2B4DE', 'F9E79F', '76D7C4', 'E8DAEF',
    'FAD7A0', 'D5DBDB', 'F5B7B1', 'AED6F1', 'A3E4D7', 'F9E79F', 'D5DBDB', 'F1C40F',
    'E74C3C', '3498DB', '2ECC71', '9B59B6', 'F39C12', '1ABC9C',
  ];
  
  const bgColor = backgroundColors[hash % backgroundColors.length];
  
  try {
    const { createAvatar } = require('@dicebear/core');
    const { 
      adventurerNeutral, 
      lorelei, 
      bigSmile 
    } = require('@dicebear/collection');
    
    let avatarStyle;
    if (style === 'adventurerNeutral') {
      avatarStyle = adventurerNeutral;
    } else if (style === 'lorelei') {
      avatarStyle = lorelei;
    } else if (style === 'bigSmile') {
      avatarStyle = bigSmile;
    } else {
      console.error(`DiceBear style ${style} not found`);
      return null;
    }
    
    const config = {
      seed: userId,
      size: 128,
      backgroundColor: [bgColor],
    };
    
    // Add style-specific configs
    if (style === 'adventurerNeutral') {
      config.scale = 90 + (hash % 21);
      config.radius = 0;
      config.clip = false;
      config.randomizeIds = true;
      config.glassesProbability = 20;
    } else if (style === 'lorelei') {
      config.radius = 0;
    } else if (style === 'bigSmile') {
      config.radius = 0;
    }
    
    const avatar = createAvatar(avatarStyle, config);
    return avatar.toDataUri();
  } catch (e) {
    console.error(`Error generating DiceBear ${style} avatar:`, e);
    return null;
  }
};

/**
 * Get DiceBear avatar URL (adventurerNeutral - same as dashboard)
 */
export const getDiceBearAvatarUrl = (userId) => {
  return generateDiceBearAvatar('adventurerNeutral', userId);
};

/**
 * Get DiceBear Lorelei avatar URL
 */
export const getDiceBearLoreleiUrl = (userId) => {
  return generateDiceBearAvatar('lorelei', userId);
};

/**
 * Get DiceBear BigSmile avatar URL
 */
export const getDiceBearBigSmileUrl = (userId) => {
  return generateDiceBearAvatar('bigSmile', userId);
};

/**
 * Get avatar URL based on avatar type
 */
export const getAvatarUrl = (avatarType, userId, username) => {
  if (avatarType === "supabase") {
    return getSupabaseAvatarUrl(userId, username);
  } else if (avatarType === "dicebear") {
    return getDiceBearAvatarUrl(userId);
  } else if (avatarType === "dicebear-lorelei") {
    return getDiceBearLoreleiUrl(userId);
  } else if (avatarType === "dicebear-bigsmile") {
    return getDiceBearBigSmileUrl(userId);
  }
  // Default to DiceBear adventurerNeutral
  return getDiceBearAvatarUrl(userId);
};

