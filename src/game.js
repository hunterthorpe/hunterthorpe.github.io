import { suburbCodes } from "./suburb_codes.js";
import { getXmlForUrl, getMedianDataFromXml, getPopulationDataFromXml } from "./abs_data.js";
import { getCoordinates, getDirectionArrow } from "./geo_data.js";
import { warningMessage, successMessage, loadingMessage } from "./main.js";
import { displayResults } from "./display_results.js";
import { addStat } from "./user_stats.js";

// Game variables and constants
export const suburbList = Object.keys(suburbCodes)
const MELBOURNE_COORD = turf.point([144.963164, -37.814251])
var guessList = []
var gameWon = false
export let hiddenSuburbName;
export let hiddenSuburb;

export async function initializeHiddenSuburb() {
    hiddenSuburbName = suburbList[Math.floor(Math.random() * (suburbList.length))];
    hiddenSuburb = await getSuburbStatistics(suburbCodes[hiddenSuburbName], await getCoordinates(hiddenSuburbName));
    console.log("Hidden suburb name: " + hiddenSuburbName);
}

export async function processGuess(searchInput) {
    const suburbGuess = searchInput.value.trim();

    if (gameWon) {
        return;
    }

    if (guessList.map(item => item.toLowerCase()).includes(suburbGuess.toLowerCase())) {
        // previously guessed suburb
        warningMessage.classList.remove('d-none');
    } else if (suburbList.map(item => item.toLowerCase()).includes(suburbGuess.toLowerCase())) {
        loadingMessage.classList.remove('d-none');
        guessList.push(suburbGuess);
        displayResults(suburbGuess, await getSuburbStatistics(suburbCodes[suburbGuess], await getCoordinates(suburbGuess)));
        
        if (suburbGuess == hiddenSuburbName) {
            gameWon = true;
            addStat(guessList.length);
            successMessage.textContent = `Congratulations! You guessed the hidden suburb in ${guessList.length} attempts!`;
            successMessage.classList.remove('d-none');
        }
    } else {
        alert('Please select a valid option from the list.');
    }
};

async function getSuburbStatistics(suburbCode, suburbPoint) {
    const populationXmlDoc = await getXmlForUrl(`https://api.data.abs.gov.au/data/ABS,C21_G01_SAL,1.0.0/..${suburbCode}..`)
    const medianXmlDoc = await getXmlForUrl(`https://api.data.abs.gov.au/data/ABS,C21_G02_SAL,1.0.0/.${suburbCode}..`)


    var suburbData = {
        cbdDistance: Math.round(turf.distance(suburbPoint, MELBOURNE_COORD, { units: 'kilometers' })),
        cbdDirection: getDirectionArrow(turf.bearing(MELBOURNE_COORD, suburbPoint)),
        population: getPopulationDataFromXml(populationXmlDoc, suburbCode, 'P_1', '3'),
        medianAge: getMedianDataFromXml(medianXmlDoc, suburbCode, '1'),
        medianIncome: Math.round((Number(getMedianDataFromXml(medianXmlDoc, suburbCode, '2')) * 52) / 1000),
        medianRent: getMedianDataFromXml(medianXmlDoc, suburbCode, '6')
    }
    return suburbData
};