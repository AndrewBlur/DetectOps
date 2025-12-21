// Helper function to decode JWT
export function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (error) { // Changed 'e' to 'error' and will use it
    console.error("Error decoding JWT:", error);
    return null;
  }
}
