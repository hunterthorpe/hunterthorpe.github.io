export async function getXmlForUrl(url) {
    const data = await fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.text(); // Parse the JSON data from the response
        })
    const parser = new DOMParser();
    return parser.parseFromString(data, 'application/xml');
};

const nsResolver = (prefix) => {
    const ns = {
        'message': 'http://www.sdmx.org/resources/sdmxml/schemas/v2_1/message',
        'generic': 'http://www.sdmx.org/resources/sdmxml/schemas/v2_1/data/generic',
        'footer': 'http://www.sdmx.org/resources/sdmxml/schemas/v2_1/message/footer',
        'common': 'http://www.sdmx.org/resources/sdmxml/schemas/v2_1/common'
    };
    return ns[prefix] || null;
};

export function getMedianDataFromXml(xmlDoc, suburbCode, statisticCode) {
    var xpathExpression = `//generic:Series[
        generic:SeriesKey/generic:Value[@id='MEDAVG' and @value='${statisticCode}'] and 
        generic:SeriesKey/generic:Value[@id='REGION' and @value='${suburbCode}'] and
        generic:Obs/generic:ObsDimension[@id='TIME_PERIOD' and @value='2021']
    ]/generic:Obs/generic:ObsValue/@value`;
    const stringValue = xmlDoc.evaluate(xpathExpression, xmlDoc, nsResolver, XPathResult.STRING_TYPE, null).stringValue;      
    if (stringValue != '') {
        return stringValue;
    } 
    return "Unknown as of 2021";
}

export function getPopulationDataFromXml(xmlDoc, suburbCode, statisticCode, sexCode) {
    var xpathExpression = `//generic:Series[
            generic:SeriesKey/generic:Value[@id='SEXP' and @value='${sexCode}'] and 
            generic:SeriesKey/generic:Value[@id='PCHAR' and @value='${statisticCode}'] and 
            generic:SeriesKey/generic:Value[@id='REGION' and @value='${suburbCode}'] and
            generic:Obs/generic:ObsDimension[@id='TIME_PERIOD' and @value='2021']
        ]/generic:Obs/generic:ObsValue/@value`;
    const stringValue = xmlDoc.evaluate(xpathExpression, xmlDoc, nsResolver, XPathResult.STRING_TYPE, null).stringValue;      
    if (stringValue != '') {
        return stringValue;
    } 
    return "Unknown as of 2021";
}