


document.addEventListener('DOMContentLoaded', () => {
    const suburbList = Object.keys(salCodes)
    const MELBOURNE_COORD = turf.point([-37.814251, 144.963164])

    $(function() {
    
        $("#search").autocomplete({
            source: suburbList
        });
    });

    // TODO this is gross
    var hiddenSuburbName = ""
    var hiddenSuburb = ""
    var hiddenSuburbLat = ""
    var hiddenSuburbLon = ""
    async function getHiddenSuburb() {
        hiddenSuburbName = suburbList[Math.floor(Math.random() * (suburbList.length))]
        console.log("Hidden suburb name: " + hiddenSuburbName)
        hiddenSuburb = await getSuburbStatistics(salCodes[hiddenSuburbName], await getCoordinates(hiddenSuburbName))
    
        const coordinates = await getCoordinates(hiddenSuburbName)
        hiddenSuburbLat = coordinates.latitude
        hiddenSuburbLon = coordinates.longitude
    }
    getHiddenSuburb()



    const submitButton = document.getElementById('submit-guess');
    const resultsContainer = document.getElementById('results-container');

    submitButton.addEventListener('click', () => {
        const suburbGuess = document.getElementById('search').value.trim();
        if (suburbGuess == hiddenSuburbName) {
            alert('You Won!')
        } else if (suburbList.map(item => item.toLowerCase()).includes(suburbGuess.toLowerCase())) {
            handleGuess(suburbGuess);
        } else {
            alert('Please select a valid option from the list.');
        }
    });

    async function handleGuess(suburbName) {

        const guessData = await getSuburbStatistics(salCodes[suburbName], await getCoordinates(suburbName))
        console.log(guessData)
        displayResults(suburbName, guessData);
    }

    function displayResults(suburbName, suburbData) {
        const resultRow = document.createElement('div');
        resultRow.className = 'result-row';

        const createCell = (content, className = '') => {
            const cell = document.createElement('div');
            cell.className = `result-cell ${className}`;
            cell.innerHTML = content;
            return cell;
        };

        resultRow.appendChild(createCell(suburbName));

        for (const key in suburbData) {       
            var unit = ""
            if (key == "medianIncome") {
                unit = "k"
            } else if (key == "cbdDistance") {
                unit = "km"
            }
            
            if (key == "cbdDirection") {
                resultRow.appendChild(createCell(`${suburbData[key] + unit}`, ''));
            } else {
                if (Number(suburbData[key]) > Number(hiddenSuburb[key])) {
                    resultRow.appendChild(createCell(`${suburbData[key] + unit} <span class=arrow-down></span>`, 'red'));
                } else if (Number(suburbData[key]) == Number(hiddenSuburb[key])) {
                    resultRow.appendChild(createCell(`${suburbData[key] + unit} <span class=gold-star></span>`, 'gold'));
                } else {
                    resultRow.appendChild(createCell(`${suburbData[key] + unit} <span class=arrow-up></span>`, 'green'));
                }
            }
        }

        // Insert the new row below the header (as the second child)
        if (resultsContainer.children.length > 1) {
            resultsContainer.insertBefore(resultRow, resultsContainer.children[1]);
        } else {
            resultsContainer.appendChild(resultRow);
        }
    }


    async function getSuburbStatistics(suburbCode, suburbPoint) {
        const populationXmlDoc = await getXmlForUrl(`https://api.data.abs.gov.au/data/ABS,C21_G01_SAL,1.0.0/..${suburbCode}..`)
        const medianXmlDoc = await getXmlForUrl(`https://api.data.abs.gov.au/data/ABS,C21_G02_SAL,1.0.0/.${suburbCode}..`)

        // Define namespace resolver

        var suburbData = {
            cbdDistance: Math.round(turf.distance(suburbPoint, MELBOURNE_COORD, { units: 'kilometers' })),
            cbdDirection: getDirectionArrow(turf.bearing(MELBOURNE_COORD, suburbPoint)),
            population: getPopulationDataFromXml(populationXmlDoc, suburbCode, 'P_1', '3'),
            medianAge: getMedianDataFromXml(medianXmlDoc, suburbCode, '1'),
            medianIncome: Math.round((Number(getMedianDataFromXml(medianXmlDoc, suburbCode, '2')) * 52) / 1000),
            medianRent: getMedianDataFromXml(medianXmlDoc, suburbCode, '6')
        }
        return suburbData
    }

    async function getXmlForUrl(url) {
        console.log(url)
        const data = await fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                return response.text(); // Parse the JSON data from the response
            })
        const parser = new DOMParser();
        return parser.parseFromString(data, 'application/xml');
    }

    const nsResolver = (prefix) => {
        const ns = {
            'message': 'http://www.sdmx.org/resources/sdmxml/schemas/v2_1/message',
            'generic': 'http://www.sdmx.org/resources/sdmxml/schemas/v2_1/data/generic',
            'footer': 'http://www.sdmx.org/resources/sdmxml/schemas/v2_1/message/footer',
            'common': 'http://www.sdmx.org/resources/sdmxml/schemas/v2_1/common'
        };
        return ns[prefix] || null;
    };

    function getMedianDataFromXml(xmlDoc, suburbCode, statisticCode) {
        var xpathExpression = `//generic:Series[
            generic:SeriesKey/generic:Value[@id='MEDAVG' and @value='${statisticCode}'] and 
            generic:SeriesKey/generic:Value[@id='REGION' and @value='${suburbCode}'] and
            generic:Obs/generic:ObsDimension[@id='TIME_PERIOD' and @value='2021']
        ]/generic:Obs/generic:ObsValue/@value`;
        const stringValue = xmlDoc.evaluate(xpathExpression, xmlDoc, nsResolver, XPathResult.STRING_TYPE, null).stringValue;      
        console.log(stringValue)
        if (stringValue != '') {
            return stringValue;
        } 
        return "Unknown as of 2021";
    }

    function getPopulationDataFromXml(xmlDoc, suburbCode, statisticCode, sexCode) {
        var xpathExpression = `//generic:Series[
                generic:SeriesKey/generic:Value[@id='SEXP' and @value='${sexCode}'] and 
                generic:SeriesKey/generic:Value[@id='PCHAR' and @value='${statisticCode}'] and 
                generic:SeriesKey/generic:Value[@id='REGION' and @value='${suburbCode}'] and
                generic:Obs/generic:ObsDimension[@id='TIME_PERIOD' and @value='2021']
            ]/generic:Obs/generic:ObsValue/@value`;
        const stringValue = xmlDoc.evaluate(xpathExpression, xmlDoc, nsResolver, XPathResult.STRING_TYPE, null).stringValue;      
        console.log(stringValue)
        if (stringValue != '') {
            return stringValue;
        } 
        return "Unknown as of 2021";
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
        return turf.point([result.lat, result.lon])
    }

});

const getDirectionArrow = (bearing) => {
    if (bearing < 0 ) bearing = 360 + bearing; // Ensure bearing is within valid range
  
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


const salCodes = {
    "Tottenham": 22556,
    "Richmond": 22170,
    "Narre Warren South": 21896,
    "Hampton East": 21132,
    "Ivanhoe": 21246,
    "Diamond Creek": 20752,
    "Huntingdale": 21218,
    "South Morang": 22311,
    "Seddon": 22256,
    "Cranbourne West": 20666,
    "Seaford": 22249,
    "Templestowe Lower": 22484,
    "Tullamarine": 22586,
    "Heathmont": 21165,
    "Montmorency": 21735,
    "Brighton": 20337,
    "Chelsea Heights": 20538,
    "Chadstone": 20528,
    "Albion": 20021,
    "Boronia": 20304,
    "Heidelberg": 21167,
    "Croydon": 20682,
    "Point Cook": 22086,
    "Doveton": 20783,
    "Donvale": 20774,
    "Pascoe Vale": 22041,
    "Lysterfield": 21558,
    "Black Rock": 20251,
    "Seaholme": 22250,
    "Coolaroo": 20624,
    "Upper Ferntree Gully": 22614,
    "Hawthorn East": 21153,
    "Carlton North": 20496,
    "Caulfield": 20521,
    "Blackburn": 20252,
    "Park Orchards": 22036,
    "Clyde": 20581,
    "Research": 22160,
    "Keilor Lodge": 21317,
    "Flemington": 20929,
    "Belgrave Heights": 20189,
    "Werribee": 22750,
    "Caroline Springs": 20500,
    "Burwood East": 20427,
    "Deer Park": 20729,
    "Airport West": 20015,
    "Wattle Glen": 22727,
    "Armadale": 20066,
    "Mordialloc": 21760,
    "Elsternwick": 20864,
    "Parkdale": 22037,
    "Forest Hill": 20937,
    "Westmeadows": 22761,
    "Albert Park": 20018,
    "Croydon North": 20684,
    "Macleod": 21564,
    "Rowville": 22207,
    "Clifton Hill": 20574,
    "Elwood": 20867,
    "Watsonia": 22721,
    "Burwood": 20426,
    "Balwyn North": 20124,
    "Warrandyte": 22702,
    "Blackburn North": 20253,
    "Ormond": 22016,
    "Burnside": 20419,
    "Keysborough": 21339,
    "Selby": 22258,
    "Thomastown": 22504,
    "Williamstown North": 22793,
    "Mont Albert": 21732,
    "Brunswick": 20361,
    "Clyde North": 20582,
    "Camberwell": 20453,
    "Brighton East": 20338,
    "Alphington": 20034,
    "Tecoma": 22476,
    "Maidstone": 21575,
    "Sunshine": 22395,
    "Upwey": 22620,
    "Carrum": 20507,
    "Box Hill": 20314,
    "Mernda": 21659,
    "Newport": 21934,
    "Burnley": 20418,
    "Mitcham": 21706,
    "St Albans": 22330,
    "Wyndham Vale": 22883,
    "Patterson Lakes": 22047,
    "Clarinda": 20566,
    "Kew": 21336,
    "Prahran": 22118,
    "Croydon Hills": 20683,
    "Sandringham": 22234,
    "Truganina": 22582,
    "Notting Hill": 21974,
    "Beaumaris": 20182,
    "Altona Meadows": 20036,
    "South Kingsville": 22309,
    "McKinnon": 21629,
    "Wantirna South": 22686,
    "Skye": 22291,
    "Ivanhoe East": 21247,
    "St Kilda East": 22344,
    "Box Hill North": 20315,
    "Niddrie": 21942,
    "Waterways": 22720,
    "The Basin": 22496,
    "Williamstown": 22792,
    "Bayswater North": 20174,
    "Kealba": 21312,
    "Plenty": 22084,
    "Narre Warren North": 21895,
    "Viewbank": 22633,
    "Heatherton": 21163,
    "Burnside Heights": 20420,
    "Brooklyn": 20352,
    "Northcote": 21971,
    "East Melbourne": 20830,
    "Ashwood": 20078,
    "Fairfield": 20901,
    "Cremorne": 20670,
    "Preston": 22121,
    "Wantirna": 22685,
    "Ferntree Gully": 20917,
    "Balaclava": 20105,
    "Eltham": 20865,
    "Edithvale": 20848,
    "Bayswater": 20173,
    "Heidelberg Heights": 21168,
    "Beaconsfield": 20175,
    "Box Hill South": 20316,
    "Warranwood": 22704,
    "Endeavour Hills": 20871,
    "Toorak": 22547,
    "Doncaster": 20771,
    "Eumemmerring": 20889,
    "Caulfield North": 20523,
    "Surrey Hills": 22399,
    "Oakleigh South": 22002,
    "Avondale Heights": 20089,
    "Clayton South": 20570,
    "Canterbury": 20468,
    "Oak Park": 21998,
    "South Yarra": 22314,
    "Cranbourne East": 20663,
    "Meadow Heights": 21635,
    "Wollert": 22820,
    "Keilor Downs": 21315,
    "Berwick": 20224,
    "Southbank": 22315,
    "Kingsville": 21365,
    "Lysterfield South": 21559,
    "Brunswick East": 20362,
    "Deepdene": 20728,
    "Belgrave": 20188,
    "Caulfield South": 20524,
    "Vermont South": 22628,
    "Kings Park": 21362,
    "Balwyn": 20123,
    "Wheelers Hill": 22766,
    "Hampton Park": 21133,
    "Port Melbourne": 22107,
    "Warrandyte South": 22703,
    "Murrumbeena": 21849,
    "Fawkner": 20909,
    "Jacana": 21248,
    "Strathmore": 22380,
    "Kensington": 21327,
    "Brunswick West": 20363,
    "Cairnlea": 20441,
    "Vermont": 22627,
    "Cheltenham": 20539,
    "Malvern": 21586,
    "Heidelberg West": 21169,
    "Yarraville": 22917,
    "Langwarrin": 21467,
    "Ascot Vale": 20075,
    "Ringwood North": 22176,
    "Lilydale": 21504,
    "Templestowe": 22483,
    "Sunshine North": 22396,
    "Springvale": 22328,
    "Bulleen": 20386,
    "Scoresby": 22242,
    "St Kilda West": 22345,
    "Hughesdale": 21214,
    "Braeside": 20320,
    "Middle Park": 21677,
    "Taylors Hill": 22473,
    "Bonbeach": 20278,
    "Manor Lakes": 21597,
    "Thornbury": 22508,
    "Frankston": 20947,
    "Delahey": 20731,
    "Aspendale": 20079,
    "Chelsea": 20537,
    "Croydon South": 20685,
    "Ringwood East": 22175,
    "Travancore": 22572,
    "Ringwood": 22174,
    "Fitzroy": 20924,
    "Kingsbury": 21363,
    "Pascoe Vale South": 22042,
    "Sydenham": 22414,
    "Highett": 21185,
    "Keilor East": 21316,
    "Laverton North": 21477,
    "Nunawading": 21985,
    "Lynbrook": 21554,
    "Oakleigh East": 22001,
    "Spotswood": 22319,
    "Docklands": 20766,
    "Essendon": 20885,
    "Mill Park": 21683,
    "Kew East": 21337,
    "Clayton": 20569,
    "Frankston South": 20949,
    "Mentone": 21648,
    "Bentleigh": 20214,
    "Blackburn South": 20254,
    "Glen Huntly": 21009,
    "Eltham North": 20866,
    "Mooroolbark": 21755,
    "Aberfeldie": 20003,
    "Chirnside Park": 20556,
    "Maribyrnong": 21604,
    "Hoppers Crossing": 21203,
    "Cranbourne South": 20665,
    "St Helena": 22339,
    "Dallas": 20702,
    "South Wharf": 22313,
    "Derrimut": 20743,
    "Ashburton": 20077,
    "Collingwood": 20616,
    "Lower Plenty": 21547,
    "Dandenong": 20707,
    "Glenroy": 21047,
    "Frankston North": 20948,
    "Kilsyth South": 21355,
    "Bangholme": 20131,
    "North Warrandyte": 21969,
    "Officer": 22006,
    "Dandenong North": 20708,
    "Junction Village": 21277,
    "Bundoora": 20399,
    "Mount Evelyn": 21795,
    "Malvern East": 21587,
    "Watsonia North": 22722,
    "Albanvale": 20017,
    "Hurstbridge": 21223,
    "Footscray": 20935,
    "Dingley Village": 20758,
    "St Kilda": 22343,
    "Sandhurst": 22232,
    "Belgrave South": 20190,
    "Broadmeadows": 20346,
    "Yallambie": 22892,
    "Princes Hill": 22122,
    "Noble Park North": 21953,
    "West Footscray": 22756,
    "Attwood": 20082,
    "Mont Albert North": 21733,
    "Campbellfield": 20455,
    "Greensborough": 21104,
    "Doncaster East": 20772,
    "Epping": 20878,
    "Briar Hill": 20331,
    "Bentleigh East": 20215,
    "Mulgrave": 21827,
    "Rosanna": 22194,
    "Kooyong": 21393,
    "Strathmore Heights": 22381,
    "Lyndhurst": 21555,
    "Greenvale": 21105,
    "Cranbourne North": 20664,
    "Ardeer": 20062,
    "West Melbourne": 22757,
    "Caulfield East": 20522,
    "Parkville": 22038,
    "Taylors Lakes": 22474,
    "Hallam": 21125,
    "Seabrook": 22247,
    "Eaglemont": 20825,
    "Mount Waverley": 21816,
    "Sunshine West": 22397,
    "Hampton": 21131,
    "Mount Eliza": 21793,
    "Knoxfield": 21374,
    "Hadfield": 21124,
    "Carnegie": 20498,
    "Mickleham": 21675,
    "Wonga Park": 22825,
    "Ripponlea": 22179,
    "North Melbourne": 21966,
    "Oakleigh": 22000,
    "Braybrook": 20324,
    "Essendon West": 20888,
    "Keilor Park": 21319,
    "Fraser Rise": 20950,
    "Moonee Ponds": 21742,
    "Hawthorn": 21152,
    "Essendon North": 20887,
    "Kilsyth": 21354,
    "Noble Park": 21952,
    "Windsor": 22805,
    "Altona": 20035,
    "Tarneit": 22451,
    "Lalor": 21452,
    "Montrose": 21736,
    "Keilor": 21314,
    "Glen Waverley": 21013,
    "Doreen": 20779,
    "Laverton": 21476,
    "Springvale South": 22329,
    "Carlton": 20495,
    "Glen Iris": 21010,
    "Pakenham": 22027,
    "Gowanbrae": 21079,
    "Craigieburn": 20661,
    "Dandenong South": 20709,
    "South Melbourne": 22310,
    "Carrum Downs": 20508,
    "Aspendale Gardens": 20080,
    "Cranbourne": 20662,
    "Coburg": 20596,
    "Altona North": 20037,
    "Gardenvale": 20965,
    "Coburg North": 20597,
    "Fitzroy North": 20925,
    "Narre Warren": 21893,
    "Gladstone Park": 21004,
    "Botanic Ridge": 20307,
    "Reservoir": 22161,
    "Melbourne": 21640,
    "Roxburgh Park": 22208,
    "Williams Landing": 22791,
    "Moorabbin": 21746,
    "Abbotsford": 20002
};