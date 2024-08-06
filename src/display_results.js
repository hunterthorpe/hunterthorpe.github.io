

import { loadingMessage } from "./main.js";
import { hiddenSuburb } from "./game.js";

export function displayResults(suburbName, suburbData) {
    const resultsContainer = document.getElementById('results-container');

    loadingMessage.classList.add('d-none'); // remove loading message

    const resultRow = document.createElement('div');
    resultRow.className = 'result-row';
    resultRow.appendChild(createCell(suburbName));

    for (const key in suburbData) {       
        var unit = ""
        if (key == "medianIncome") {
            unit = "k"
        } else if (key == "cbdDistance") {
            unit = "km"
        }
        
        if (key == "cbdDirection") {
            if (suburbData[key] == hiddenSuburb[key]) {
                resultRow.appendChild(createCell(`${suburbData[key] + unit} <span class=gold-star></span>`, 'gold'));
            } else {
                resultRow.appendChild(createCell(`${suburbData[key] + unit}`, ''));
            }
        } else {
            if (Number(suburbData[key]) > Number(hiddenSuburb[key])) {
                // guess data point for this value is less than hidden suburb
                resultRow.appendChild(createCell(`${formatNumber(suburbData[key], unit)} <span class=arrow-down></span>`, 'red'));
            } else if (Number(suburbData[key]) == Number(hiddenSuburb[key])) {
                // guess data point for this value is equal than hidden suburb
                resultRow.appendChild(createCell(`${formatNumber(suburbData[key], unit)} <span class=gold-star></span>`, 'gold'));
            } else {
                // guess data point for this value is greater than hidden suburb
                resultRow.appendChild(createCell(`${formatNumber(suburbData[key], unit)} <span class=arrow-up></span>`, 'green'));
            }
        }
    }

    // insert at the top of list but after, header and loading div
    resultsContainer.insertBefore(resultRow, resultsContainer.children[2]);
};

function formatNumber(string, unit) {
    return Number(string).toLocaleString() + unit;
};

const createCell = (content, className = '') => {
    const cell = document.createElement('div');
    cell.className = `result-cell ${className}`;
    cell.innerHTML = content;
    return cell;
};