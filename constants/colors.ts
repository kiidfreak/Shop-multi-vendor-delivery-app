
const Common = {
  primary: "#F57C00",
  success: "#4CAF50",
  warning: "#FF9800",
  error: "#F44336",
};

export const LightColors = {
  ...Common,
  secondary: "#FFF3E0",
  accent: "#6D4C41",
  background: "#FEF6E8",
  card: "#FFFFFF",
  text: "#3E2723",
  textLight: "#8D6E63",
  border: "#E0D5C7",
  shadow: "#00000015",
  icon: "#6D4C41",
  tabBarActive: "#F57C00",
  tabBarInactive: "#A1887F",
};

export const DarkColors = {
  ...Common,
  secondary: "#2D2622", // Dark brown for secondary backgrounds
  accent: "#E0D5C7",
  background: "#121212",
  card: "#1E1E1E",
  text: "#E0E0E0",
  textLight: "#9E9E9E",
  border: "#333333",
  shadow: "#000000AA",
  icon: "#E0E0E0",
  tabBarActive: "#F57C00",
  tabBarInactive: "#757575",
};

// Keep default export pointing to Light for safety/fallback if needed, 
// though we will be migrating away from default import.
export default LightColors;
