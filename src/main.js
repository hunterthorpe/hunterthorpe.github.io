import { processGuess, suburbList, initializeHiddenSuburb } from "./game.js";
import { displayStatistics } from "./user_stats.js";

export let warningMessage;
export let successMessage;
export let loadingMessage;

document.addEventListener('DOMContentLoaded', () => {

    console.log("DOMContentLoaded");
    warningMessage = document.getElementById('warning-message');
    successMessage = document.getElementById('success-message');
    loadingMessage = document.getElementById('loading-message');
    const submitButton = document.getElementById('submit-guess');
    const searchInput = document.getElementById('search')
    initializeHiddenSuburb();

    searchInput.addEventListener('focus', function() {
        const warningMessage = document.getElementById('warning-message');
        warningMessage.classList.add('d-none');
    });

    submitButton.addEventListener('click', () => processGuess(searchInput));
    
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            processGuess(searchInput);
        }
    });

    $(document).ready(function() {
        $('#statisticsModal').on('shown.bs.modal', function () {
            displayStatistics();
        });
    });

    $(function() {
        $("#search").autocomplete({
            source: suburbList.sort((a, b) => a.localeCompare(b)),
            minLength: 0 
        }).focus(function() {
            // Trigger the search with an empty string when the input gains focus
            $(this).autocomplete("search", "");
        });
    });

});

