
export async function getCoordinates(cityName) {
    const data = await fetch(`https://nominatim.openstreetmap.org/search?city=${cityName}&countrycodes=AU&state=Victoria&format=json`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json(); // Parse the JSON data from the response
        })
    const result = data.find(item => item.display_name.includes('Australia'));
    return turf.point([result.lon, result.lat])
}


export const getDirectionArrow = (bearing) => {
    if (bearing < 0) {
        bearing += 360
    }

    if (bearing >= 337.5 || bearing < 22.5) return "⬆️";  // N
    if (bearing >= 22.5 && bearing < 67.5) return "↗️";   // NE
    if (bearing >= 67.5 && bearing < 112.5) return "➡️";  // E
    if (bearing >= 112.5 && bearing < 157.5) return "↘️"; // SE
    if (bearing >= 157.5 && bearing < 202.5) return "⬇️"; // S
    if (bearing >= 202.5 && bearing < 247.5) return "↙️"; // SW
    if (bearing >= 247.5 && bearing < 292.5) return "⬅️"; // W
    if (bearing >= 292.5 && bearing < 337.5) return "↖️"; // NW
  
    return null; // Fallback in case of an unexpected value
  };