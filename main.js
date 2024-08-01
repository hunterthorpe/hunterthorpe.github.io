


document.addEventListener('DOMContentLoaded', () => {
    const councilList = Object.keys(councilCodes)

    $(function() {
    
        $("#search").autocomplete({
            source: councilList
        });
    });

    // TODO this is gross
    var hiddenCouncilName = ""
    var hiddenCouncil = ""
    var hiddenCouncilLat = ""
    var hiddenCouncilLon = ""
    async function getHiddenCouncil() {
        hiddenCouncilName = councilList[Math.floor(Math.random() * (councilList.length))]
        hiddenCouncil = await getStatisticsForCouncil(councilCodes[hiddenCouncilName])
        console.log(hiddenCouncilName)
        const coordinates = await getCoordinates(hiddenCouncilName)
        hiddenCouncilLat = coordinates.latitude
        hiddenCouncilLon = coordinates.longitude
    }
    getHiddenCouncil()

    


    const submitButton = document.getElementById('submit-guess');
    const resultsContainer = document.getElementById('results-container');

    submitButton.addEventListener('click', () => {
        const councilGuess = document.getElementById('search').value.trim();
        if (councilGuess == hiddenCouncilName) {
            alert('You Won!')
        } else if ((Object.keys(councilCodes).map(item => item.toLowerCase())).includes(councilGuess.toLowerCase())) {
            fetchLgaData(councilGuess);
        } else {
            alert('Please select a valid option from the list.');
        }
    });

    async function fetchLgaData(councilName) {

        const guessData = await getStatisticsForCouncil(councilCodes[councilName])
        console.log(guessData)
        const geoData = await getGeoData(councilName)
        displayResults(councilName, guessData, geoData);
    }

    function displayResults(councilName, councilData, geoData) {
        const resultRow = document.createElement('div');
        resultRow.className = 'result-row';

        const createCell = (content, className = '') => {
            const cell = document.createElement('div');
            cell.className = `result-cell ${className}`;
            cell.innerHTML = content;
            return cell;
        };

        resultRow.appendChild(createCell(councilName));


        resultRow.appendChild(createCell(geoData))
        for (const key in councilData) {
            console.log(key)
            console.log(Number(councilData[key]))
            console.log(Number(hiddenCouncil[key]))
            
            if (Number(councilData[key]) > Number(hiddenCouncil[key])) {
                resultRow.appendChild(createCell(`${councilData[key]} <span class=arrow-down></span>`, 'red'));
            } else {
                resultRow.appendChild(createCell(`${councilData[key]} <span class=arrow-up></span>`, 'green'));
            }
        }

        // Insert the new row below the header (as the second child)
        if (resultsContainer.children.length > 1) {
            resultsContainer.insertBefore(resultRow, resultsContainer.children[1]);
        } else {
            resultsContainer.appendChild(resultRow);
        }
    }


    async function getStatisticsForCouncil(councilCode) {
        const data = await fetch(`https://api.data.abs.gov.au/data/ABS,ABS_REGIONAL_LGA2021,1.2.0/..${councilCode}.A?startPeriod=2020&dimensionAtObservation=AllDimensions`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                return response.text(); // Parse the JSON data from the response
            })
            
        // Parse the XML string into a DOM object
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, 'application/xml');
    
        // Define namespace resolver
        const nsResolver = (prefix) => {
            const ns = {
            'message': 'http://www.sdmx.org/resources/sdmxml/schemas/v2_1/message',
            'generic': 'http://www.sdmx.org/resources/sdmxml/schemas/v2_1/data/generic',
            'footer': 'http://www.sdmx.org/resources/sdmxml/schemas/v2_1/message/footer',
            'common': 'http://www.sdmx.org/resources/sdmxml/schemas/v2_1/common'
            };
            return ns[prefix] || null;
        };

        const lgaData = {
            population: getStatistic(xmlDoc, nsResolver, 'ERP_P_20'),
            medianIncome: getStatistic(xmlDoc, nsResolver, 'INCOME_17'),
            medianHousePrice: getStatistic(xmlDoc, nsResolver, 'HOUSES_3'),
            medianAge: getStatistic(xmlDoc, nsResolver, 'ERP_23')
        };
    
        console.log(lgaData);

        return lgaData; // Return lgaData here if needed
    }

    

    function getStatistic(xmlDoc, nsResolver, measure) {
         // gets most recent value for measure, up until 2020
        for (let year = new Date().getFullYear(); year >= 2020; year--) {
            const xpathExpression = `
                  //generic:Obs[
                    generic:ObsKey/generic:Value[@id='TIME_PERIOD' and @value='${year}'] and 
                    generic:ObsKey/generic:Value[@id='MEASURE' and @value='${measure}']
                  ]/generic:ObsValue/@value`;

            const stringValue = xmlDoc.evaluate(xpathExpression, xmlDoc, nsResolver, XPathResult.STRING_TYPE, null).stringValue;      
            if (stringValue != '') {
                return stringValue;
            }
        }
        return "Unknown as of 2020";
    }

    async function getCoordinates(cityName) {
        const data = await fetch(`https://nominatim.openstreetmap.org/search?city=${cityName}&countrycodes=AU&state=Victoria&format=json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                return response.json(); // Parse the JSON data from the response
            })
        console.log(data)
        const result = data.find(item => item.display_name.includes('Australia'));
        return {
            latitude: result.lat,
            longitude: result.lon
        }
    }

    async function getGeoData(cityName) {
        const guessCordinates = await getCoordinates(cityName)
        const guessPoint = turf.point([guessCordinates.longitude, guessCordinates.latitude])
        const distance = turf.distance(guessPoint,
            turf.point([hiddenCouncilLon, hiddenCouncilLat]), { units: 'kilometers' })
        console.log(distance)

        const bearing = turf.bearing(guessPoint, turf.point([hiddenCouncilLon, hiddenCouncilLat]))
        console.log(bearing)
        console.log(getDirectionArrow(bearing))
        return `${Math.round(distance).toLocaleString()}km ` + getDirectionArrow(bearing)
    }

});

const getDirectionArrow = (bearing) => {
    if (bearing < 0 ) bearing = 360 + bearing; // Ensure bearing is within valid range
  
    if (bearing >= 348.75 || bearing < 11.25) return "⬆️";
    if (bearing >= 11.25 && bearing < 33.75) return "↗️";
    if (bearing >= 33.75 && bearing < 56.25) return "↗️";
    if (bearing >= 56.25 && bearing < 78.75) return "↗️";
    if (bearing >= 78.75 && bearing < 101.25) return "➡️";
    if (bearing >= 101.25 && bearing < 123.75) return "↘️";
    if (bearing >= 123.75 && bearing < 146.25) return "↘️";
    if (bearing >= 146.25 && bearing < 168.75) return "↘️";
    if (bearing >= 168.75 && bearing < 191.25) return "⬇️";
    if (bearing >= 191.25 && bearing < 213.75) return "↙️";
    if (bearing >= 213.75 && bearing < 236.25) return "↙️";
    if (bearing >= 236.25 && bearing < 258.75) return "↙️";
    if (bearing >= 258.75 && bearing < 281.25) return "⬅️";
    if (bearing >= 281.25 && bearing < 303.75) return "↖️";
    if (bearing >= 303.75 && bearing < 326.25) return "↖️";
    if (bearing >= 326.25 && bearing < 348.75) return "↖️";
  
    return null; // Fallback in case of an unexpected value
  };


const suburbCodes = {
    "Brunswick East": 206011106,
    "Brunswick West": 206011107,
    "Pascoe Vale South": 206011109,
    "Brunswick - North": 206011495,
    "Brunswick - South": 206011496,
    "Coburg - East": 206011497,
    "Coburg - West": 206011498,
    "Alphington - Fairfield": 206021110,
    "Thornbury": 206021112,
    "Northcote - East": 206021499,
    "Northcote - West": 206021500,
    "Ascot Vale": 206031113,
    "Flemington": 206031115,
    "Moonee Ponds": 206031116,
    "Essendon (West) - Aberfeldie": 206031501,
    "Essendon - East": 206031502,
    "Carlton": 206041117,
    "Docklands": 206041118,
    "East Melbourne": 206041119,
    "Flemington Racecourse": 206041120,
    "Kensington (Vic.)": 206041121,
    "Parkville": 206041124,
    "South Yarra - West": 206041125,
    "West Melbourne - Industrial": 206041127,
    "Melbourne CBD - East": 206041503,
    "Melbourne CBD - North": 206041504,
    "Melbourne CBD - West": 206041505,
    "North Melbourne": 206041506,
    "Royal Botanic Gardens Victoria": 206041507,
    "Southbank (West) - South Wharf": 206041508,
    "Southbank - East": 206041509,
    "West Melbourne - Residential": 206041510,
    "Albert Park": 206051128,
    "Elwood": 206051129,
    "Port Melbourne": 206051130,
    "St Kilda East": 206051134,
    "Port Melbourne Industrial": 206051511,
    "South Melbourne": 206051512,
    "St Kilda - Central": 206051513,
    "St Kilda - West": 206051514,
    "Armadale": 206061135,
    "Prahran - Windsor": 206061136,
    "Toorak": 206061138,
    "South Yarra - North": 206061515,
    "South Yarra - South": 206061516,
    "Abbotsford": 206071139,
    "Carlton North - Princes Hill": 206071140,
    "Collingwood": 206071141,
    "Fitzroy": 206071142,
    "Fitzroy North": 206071143,
    "Clifton Hill - Alphington": 206071145,
    "Richmond (South) - Cremorne": 206071517,
    "Richmond - North": 206071518,
    "Ashburton (Vic.)": 207011146,
    "Balwyn": 207011147,
    "Balwyn North": 207011148,
    "Camberwell": 207011149,
    "Glen Iris - East": 207011150,
    "Hawthorn East": 207011152,
    "Kew East": 207011154,
    "Surrey Hills (West) - Canterbury": 207011155,
    "Hawthorn - North": 207011519,
    "Hawthorn - South": 207011520,
    "Kew - South": 207011521,
    "Kew - West": 207011522,
    "Bulleen": 207021156,
    "Doncaster": 207021157,
    "Templestowe": 207021159,
    "Templestowe Lower": 207021160,
    "Doncaster East - North": 207021424,
    "Doncaster East - South": 207021425,
    "Blackburn": 207031161,
    "Blackburn South": 207031162,
    "Box Hill": 207031163,
    "Box Hill North": 207031164,
    "Burwood (Vic.)": 207031165,
    "Burwood East": 207031166,
    "Surrey Hills (East) - Mont Albert": 207031167,
    "Beaumaris": 208011168,
    "Brighton (Vic.)": 208011169,
    "Brighton East": 208011170,
    "Highett (West) - Cheltenham": 208011171,
    "Hampton": 208011172,
    "Sandringham - Black Rock": 208011173,
    "Bentleigh - McKinnon": 208021174,
    "Carnegie": 208021176,
    "Caulfield - North": 208021177,
    "Caulfield - South": 208021178,
    "Elsternwick": 208021179,
    "Hughesdale": 208021180,
    "Murrumbeena": 208021181,
    "Ormond - Glen Huntly": 208021182,
    "Bentleigh East - North": 208021426,
    "Bentleigh East - South": 208021427,
    "Aspendale Gardens - Waterways": 208031183,
    "Braeside": 208031184,
    "Carrum - Patterson Lakes": 208031185,
    "Chelsea - Bonbeach": 208031186,
    "Chelsea Heights": 208031187,
    "Highett (East) - Cheltenham": 208031188,
    "Edithvale - Aspendale": 208031189,
    "Mentone": 208031190,
    "Moorabbin - Heatherton": 208031191,
    "Moorabbin Airport": 208031192,
    "Mordialloc - Parkdale": 208031193,
    "Malvern - Glen Iris": 208041194,
    "Malvern East": 208041195,
    "Bundoora - East": 209011196,
    "Greensborough": 209011197,
    "Heidelberg - Rosanna": 209011198,
    "Heidelberg West": 209011199,
    "Ivanhoe": 209011200,
    "Ivanhoe East - Eaglemont": 209011201,
    "Montmorency - Briar Hill": 209011202,
    "Viewbank - Yallambie": 209011203,
    "Watsonia": 209011204,
    "Kingsbury": 209021205,
    "Preston - East": 209021428,
    "Preston - West": 209021429,
    "Reservoir - North East": 209021523,
    "Reservoir - North West": 209021524,
    "Reservoir - South East": 209021525,
    "Reservoir - South West": 209021526,
    "Eltham": 209031209,
    "Hurstbridge": 209031210,
    "Kinglake": 209031211,
    "Panton Hill - St Andrews": 209031212,
    "Plenty - Yarrambat": 209031213,
    "Research - North Warrandyte": 209031214,
    "Wattle Glen - Diamond Creek": 209031215,
    "Bundoora - North": 209041216,
    "Bundoora - West": 209041217,
    "Mill Park - North": 209041220,
    "Mill Park - South": 209041221,
    "Thomastown": 209041223,
    "Wallan": 209041224,
    "Whittlesea": 209041225,
    "Epping - East": 209041431,
    "Epping - South": 209041432,
    "Epping (Vic.) - West": 209041433,
    "South Morang - North": 209041435,
    "South Morang - South": 209041436,
    "Wollert": 209041437,
    "Doreen - North": 209041527,
    "Doreen - South": 209041528,
    "Lalor - East": 209041529,
    "Lalor - West": 209041530,
    "Mernda - North": 209041531,
    "Mernda - South": 209041532,
    "Airport West": 210011226,
    "Essendon Airport": 210011227,
    "Keilor": 210011228,
    "Niddrie - Essendon West": 210011230,
    "Strathmore": 210011231,
    "Avondale Heights": 210011533,
    "Keilor East": 210011534,
    "Gisborne": 210021232,
    "Macedon": 210021233,
    "Riddells Creek": 210021234,
    "Romsey": 210021235,
    "Coburg North": 210031236,
    "Fawkner": 210031237,
    "Gowanbrae": 210031439,
    "Hadfield": 210031440,
    "Glenroy - East": 210031535,
    "Glenroy - West": 210031536,
    "Oak Park": 210031537,
    "Pascoe Vale": 210031538,
    "Sunbury": 210041240,
    "Diggers Rest": 210041539,
    "Sunbury - South": 210041540,
    "Sunbury - West": 210041541,
    "Broadmeadows": 210051242,
    "Campbellfield - Coolaroo": 210051243,
    "Gladstone Park - Westmeadows": 210051245,
    "Greenvale - Bulla": 210051246,
    "Meadow Heights": 210051247,
    "Melbourne Airport": 210051248,
    "Tullamarine": 210051250,
    "Craigieburn - Central": 210051441,
    "Craigieburn - North": 210051442,
    "Craigieburn - South": 210051443,
    "Mickleham - Yuroke": 210051445,
    "Craigieburn - North West": 210051542,
    "Craigieburn - West": 210051543,
    "Roxburgh Park (South) - Somerton": 210051544,
    "Roxburgh Park - North": 210051545,
    "Ardeer - Albion": 213011328,
    "Cairnlea": 213011329,
    "Delahey": 213011331,
    "Keilor Downs": 213011332,
    "Kings Park (Vic.)": 213011333,
    "St Albans - North": 213011334,
    "St Albans - South": 213011335,
    "Sunshine": 213011336,
    "Sunshine North": 213011337,
    "Sunshine West": 213011338,
    "Sydenham": 213011339,
    "Taylors Lakes": 213011340,
    "Deer Park": 213011569,
    "Derrimut": 213011570,
    "Altona": 213021341,
    "Altona Meadows": 213021342,
    "Altona North": 213021343,
    "Newport": 213021344,
    "Seabrook": 213021345,
    "Williamstown": 213021346,
    "Braybrook": 213031347,
    "Footscray": 213031348,
    "Maribyrnong": 213031349,
    "Seddon - Kingsville": 213031350,
    "West Footscray - Tottenham": 213031351,
    "Yarraville": 213031352,
    "Bacchus Marsh": 213041353,
    "Melton West": 213041358,
    "Rockbank - Mount Cottrell": 213041359,
    "Taylors Hill": 213041360,
    "Burnside": 213041461,
    "Burnside Heights": 213041462,
    "Caroline Springs": 213041463,
    "Brookfield": 213041571,
    "Cobblebank - Strathtulloh": 213041572,
    "Eynesbury - Exford": 213041573,
    "Fraser Rise - Plumpton": 213041574,
    "Hillside": 213041575,
    "Kurunjang - Toolern Vale": 213041576,
    "Melton": 213041577,
    "Melton South - Weir Views": 213041578,
    "Hoppers Crossing - North": 213051361,
    "Hoppers Crossing - South": 213051362,
    "Laverton": 213051363,
    "Werribee - South": 213051368,
    "Point Cook - East": 213051464,
    "Point Cook - South": 213051466,
    "Werribee - East": 213051467,
    "Werribee - West": 213051468,
    "Manor Lakes - Quandong": 213051579,
    "Point Cook - North East": 213051580,
    "Point Cook - North West": 213051581,
    "Tarneit (West) - Mount Cottrell": 213051582,
    "Tarneit - Central": 213051583,
    "Tarneit - North": 213051584,
    "Tarneit - South": 213051585,
    "Truganina - North": 213051586,
    "Truganina - South East": 213051587,
    "Truganina - South West": 213051588,
    "Wyndham Vale - North": 213051589,
    "Wyndham Vale - South": 213051590
  };

  const suburbs = [
    "Melbourne",
    "St Kilda",
    "Richmond",
    "Frankston",
    "Carlton",
    "North Melbourne",
    "Brighton",
    "Dandenong",
    "South Melbourne",
    "Collingwood",
    "Hawthorn",
    "Essendon",
    "Port Melbourne",
    "Footscray",
    "Fitzroy",
    "Docklands",
    "Toorak",
    "Box Hill",
    "Brunswick",
    "South Yarra",
    "Werribee",
    "Williamstown",
    "Kew",
    "East Melbourne",
    "Glen Waverley",
    "Sunshine",
    "Ringwood",
    "Altona",
    "Preston",
    "Doncaster",
    "West Melbourne",
    "Camberwell",
    "Cranbourne",
    "Clayton",
    "Malvern",
    "Coburg",
    "Pakenham",
    "Lilydale",
    "Caulfield",
    "Heidelberg",
    "Albert Park",
    "Southbank",
    "Sandringham",
    "Prahran",
    "Chadstone",
    "Moonee Ponds",
    "Flemington",
    "Oakleigh",
    "Parkville",
    "Eltham",
    "Northcote",
    "Springvale",
    "Glen Iris",
    "Blackburn",
    "Broadmeadows",
    "Tullamarine",
    "Moorabbin",
    "Epping",
    "Chelsea",
    "Mount Waverley",
    "Burwood",
    "Ivanhoe",
    "Kensington",
    "Brunswick East",
    "Greensborough",
    "Craigieburn",
    "Reservoir",
    "Yarraville",
    "Point Cook",
    "Bundoora",
    "Elwood",
    "Keilor",
    "Malvern East",
    "Ferntree Gully",
    "Carlton North",
    "Belgrave",
    "St Kilda East",
    "Balwyn",
    "Frankston South",
    "Mentone",
    "Dandenong South",
    "Kew East",
    "Brunswick West",
    "Hampton",
    "Brighton East",
    "Bentleigh",
    "Hoppers Crossing",
    "Hawthorn East",
    "Fitzroy North",
    "Black Rock",
    "Doncaster East",
    "Box Hill North",
    "Thornbury",
    "Thomastown",
    "Templestowe",
    "Pascoe Vale",
    "Airport West",
    "Ascot Vale",
    "Narre Warren",
    "West Footscray",
    "Elsternwick",
    "Mernda",
    "Croydon",
    "Abbotsford",
    "Burnley",
    "Surrey Hills",
    "Mordialloc",
    "Clifton Hill",
    "Nunawading",
    "Cheltenham",
    "Windsor",
    "Vermont",
    "South Morang",
    "Carrum",
    "Box Hill South",
    "Berwick",
    "Officer",
    "Dandenong North",
    "Middle Park",
    "Altona North",
    "Ringwood East",
    "Fairfield",
    "Frankston North",
    "Balwyn North",
    "Mount Eliza",
    "Carnegie",
    "Mitcham",
    "St Albans",
    "Canterbury",
    "Coburg North",
    "Maribyrnong",
    "Warrandyte",
    "Ashburton",
    "St Kilda West",
    "Deer Park",
    "Seaford",
    "Sunshine West",
    "Alphington",
    "Tarneit",
    "Armadale",
    "Wantirna",
    "Newport",
    "Mont Albert",
    "Balaclava",
    "Cremorne",
    "Hurstbridge",
    "Rowville",
    "Diamond Creek",
    "Laverton",
    "Caroline Springs",
    "Bulleen",
    "Caulfield South",
    "Caulfield North",
    "Noble Park",
    "Bayswater",
    "Spotswood",
    "South Wharf",
    "Blackburn South",
    "Blackburn North",
    "Burwood East",
    "Clayton South",
    "Rosanna",
    "Donvale",
    "Cranbourne East",
    "Fawkner",
    "Boronia",
    "Carrum Downs",
    "Cranbourne North",
    "Keilor East",
    "Edithvale",
    "Oakleigh South",
    "Cranbourne South",
    "Heidelberg West",
    "Lalor",
    "Ringwood North",
    "Vermont South",
    "Truganina",
    "Aspendale",
    "Cranbourne West",
    "Roxburgh Park",
    "Sunshine North",
    "Taylors Lakes",
    "Caulfield East",
    "Bentleigh East",
    "Seddon",
    "Essendon North",
    "Glenroy",
    "Mulgrave",
    "Williamstown North",
    "Keysborough",
    "Upper Ferntree Gully",
    "Murrumbeena",
    "Beaumaris",
    "Mill Park",
    "Kooyong",
    "Altona Meadows",
    "Wantirna South",
    "Parkdale",
    "Beaconsfield",
    "Watsonia",
    "Ripponlea",
    "Brooklyn",
    "Wheelers Hill",
    "Ormond",
    "Clyde",
    "Keilor Downs",
    "Campbellfield",
    "Ashwood",
    "Greenvale",
    "Plenty",
    "Upwey",
    "Princes Hill",
    "Highett",
    "Doreen",
    "Wyndham Vale",
    "Springvale South",
    "Bonbeach",
    "Macleod",
    "Glen Huntly",
    "Ivanhoe East",
    "Montmorency",
    "Heidelberg Heights",
    "Eltham North",
    "Huntingdale",
    "Strathmore",
    "Mooroolbark",
    "Deepdene",
    "Narre Warren North",
    "Croydon North",
    "Hallam",
    "Oakleigh East",
    "Essendon West",
    "Narre Warren South",
    "Lower Plenty",
    "Templestowe Lower",
    "Williams Landing",
    "Hughesdale",
    "Tottenham",
    "Forest Hill",
    "Gardenvale",
    "Eaglemont",
    "Croydon South",
    "Tecoma",
    "Knoxfield",
    "Lysterfield",
    "Pascoe Vale South",
    "Clyde North",
    "Travancore",
    "Kilsyth",
    "Kingsville",
    "Wollert",
    "McKinnon",
    "Patterson Lakes",
    "Heathmont",
    "Keilor Park",
    "Langwarrin",
    "Research",
    "Seaholme",
    "Scoresby",
    "Dallas",
    "Coolaroo",
    "Westmeadows",
    "Hampton East",
    "Braybrook",
    "Dingley Village",
    "Jacana",
    "Endeavour Hills",
    "Hampton Park",
    "Laverton North",
    "Chirnside Park",
    "Albion",
    "Derrimut",
    "Mickleham",
    "Oak Park",
    "Avondale Heights",
    "Maidstone",
    "Niddrie",
    "Sydenham",
    "Chelsea Heights",
    "Park Orchards",
    "North Warrandyte",
    "Doveton",
    "Skye",
    "The Basin",
    "Belgrave South",
    "Mont Albert North",
    "Aberfeldie",
    "Ardeer",
    "Taylors Hill",
    "Kingsbury",
    "Bayswater North",
    "Notting Hill",
    "Warrandyte South",
    "Montrose",
    "Croydon Hills",
    "Wattle Glen",
    "St Helena",
    "Warranwood",
    "Watsonia North",
    "Wonga Park",
    "Braeside",
    "Mount Evelyn",
    "Noble Park North",
    "Aspendale Gardens",
    "Bellfield",
    "Briar Hill",
    "Lynbrook",
    "Burnside",
    "Seabrook",
    "Heatherton",
    "Clarinda",
    "Meadow Heights",
    "South Kingsville",
    "Gladstone Park",
    "Viewbank",
    "Hadfield",
    "Yallambie",
    "Belgrave Heights",
    "Hillside",
    "Kilsyth South",
    "Keilor Lodge",
    "Lyndhurst",
    "Strathmore Heights",
    "Waterways",
    "Manor Lakes",
    "Kealba",
    "Kings Park",
    "Eumemmerring",
    "Cairnlea",
    "Selby",
    "Gowanbrae",
    "Attwood",
    "Lysterfield South",
    "Delahey",
    "Albanvale",
    "Bangholme",
    "Burnside Heights",
    "Junction Village",
    "Botanic Ridge",
    "Sandhurst",
    "Fraser Rise"
  ]

const councilCodes = {
    "Alpine": 20110,
    "Ararat": 20260,
    "Ballarat": 20570,
    "Banyule": 20660,
    "Bass Coast": 20740,
    "Baw Baw": 20830,
    "Bayside (Vic.)": 20910,
    "Benalla": 21010,
    "Boroondara": 21110,
    "Brimbank": 21180,
    "Buloke": 21270,
    "Campaspe": 21370,
    "Cardinia": 21450,
    "Casey": 21610,
    "Central Goldfields": 21670,
    "Colac Otway": 21750,
    "Corangamite": 21830,
    "Darebin": 21890,
    "East Gippsland": 22110,
    "Frankston": 22170,
    "Gannawarra": 22250,
    "Glen Eira": 22310,
    "Glenelg": 22410,
    "Golden Plains": 22490,
    "Greater Bendigo": 22620,
    "Greater Dandenong": 22670,
    "Greater Geelong": 22750,
    "Greater Shepparton": 22830,
    "Hepburn": 22910,
    "Hindmarsh": 22980,
    "Hobsons Bay": 23110,
    "Horsham": 23190,
    "Hume": 23270,
    "Indigo": 23350,
    "Kingston (Vic.)": 23430,
    "Knox": 23670,
    "Latrobe (Vic.)": 23810,
    "Loddon": 23940,
    "Macedon Ranges": 24130,
    "Manningham": 24210,
    "Mansfield": 24250,
    "Maribyrnong": 24330,
    "Maroondah": 24410,
    "Melbourne": 24600,
    "Melton": 24650,
    "Mildura": 24780,
    "Mitchell": 24850,
    "Moira": 24900,
    "Monash": 24970,
    "Moonee Valley": 25060,
    "Moorabool": 25150,
    "Moreland": 25250,
    "Mornington Peninsula": 25340,
    "Mount Alexander": 25430,
    "Moyne": 25490,
    "Murrindindi": 25620,
    "Nillumbik": 25710,
    "Northern Grampians": 25810,
    "Port Phillip": 25900,
    "Pyrenees": 25990,
    "Queenscliffe": 26080,
    "South Gippsland": 26170,
    "Southern Grampians": 26260,
    "Stonnington": 26350,
    "Strathbogie": 26430,
    "Surf Coast": 26490,
    "Swan Hill": 26610,
    "Towong": 26670,
    "Wangaratta": 26700,
    "Warrnambool": 26730,
    "Wellington": 26810,
    "West Wimmera": 26890,
    "Whitehorse": 26980
};