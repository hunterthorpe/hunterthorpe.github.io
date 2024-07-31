
document.addEventListener('DOMContentLoaded', () => {
    const councilList = Object.keys(councilCodes)

    $(function() {
    
        $("#search").autocomplete({
            source: councilList
        });
    });

    const hiddenCouncilName = councilList[Math.floor(Math.random() * (councilList.length))]
    const hiddenCouncil = getStatisticsForCouncil(councilCodes[hiddenCouncilName])
    console.log(hiddenCouncilName)


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
        const distanceData = {
            distanceFromTarget: 20,
            directionFromTarget: 'North'
        };

        const guessData = await getStatisticsForCouncil(councilCodes[councilName])
        console.log(guessData)
        displayResults(councilName, guessData, distanceData);
    }

    function displayResults(councilName, councilData, distanceData) {
        const resultRow = document.createElement('div');
        resultRow.className = 'result-row';

        const createCell = (content, className = '') => {
            const cell = document.createElement('div');
            cell.className = `result-cell ${className}`;
            cell.innerHTML = content;
            return cell;
        };

        resultRow.appendChild(createCell(councilName));


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
        councilCode
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

});



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