
const Common = {
  primary: "#009B3A", // Rasta Green
  secondary: "#FED100", // Rasta Yellow
  accent: "#CE1126", // Rasta Red
  success: "#009B3A",
  warning: "#FED100",
  error: "#CE1126",
};

export const LightColors = {
  ...Common,
  background: "#F2F2F2",
  card: "#FFFFFF",
  text: "#121212",
  textLight: "#757575",
  border: "#E0E0E0",
  shadow: "#00000010",
  icon: "#121212",
  tabBarActive: "#009B3A",
  tabBarInactive: "#9E9E9E",
};

export const DarkColors = {
  ...Common,
  background: "#0B1020", // Deep Midnight Blue
  card: "#161B2E", // Lighter Blue-Black
  text: "#FFFFFF",
  textLight: "#E0E0E0", // Brighter for visibility
  border: "#444444", // More visible border
  shadow: "#000000",
  icon: "#FFFFFF",
  tabBarActive: "#FED100", // Yellow pops on dark
  tabBarInactive: "#888888",
};

// Keep default export pointing to Light for safety/fallback if needed, 
// though we will be migrating away from default import.
export default LightColors;
