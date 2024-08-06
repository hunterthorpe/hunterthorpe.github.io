

function getUserStats() {
    var localStats = localStorage.getItem("stats");
    console.log(localStats)

    if(localStats === null) {
        return [];
    } else {
        return JSON.parse(localStats);
    } 
} 

export function addStat(guessCount) {
    var stats = getUserStats();
    stats.push(guessCount);
    localStorage.setItem("stats", JSON.stringify(stats));
} 


export function displayStatistics() {
    var stats = getUserStats();
    console.log(stats)
    var averageGuessCount = stats.reduce((a, b) => a + b, 0) / stats.length

    displayChart(stats);

    document.getElementById('guessSummary').textContent = 
        `You have guessed the hidden suburb ${stats.length} times, with an average guess count of ${averageGuessCount.toFixed(2)}.`;
}

function displayChart(stats) {
    var existingChart = Chart.getChart('guessChart')
    if (existingChart) {
        existingChart.destroy();
    }

    const guessMap = {};
    for (let i = 1; i <= Math.max(...stats); i++) {
        guessMap[i] = 0;
    }
    stats.forEach(count => {
        guessMap[count] = guessMap[count] + 1;
    });

    const ctx = document.getElementById('guessChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(guessMap),
            datasets: [{
                data: Object.values(guessMap),
                backgroundColor: 'rgba(54, 162, 235, 1)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: false 
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    },
                    title: {
                        display: true,
                        text: '# of guesses', // Label for y-axis
                        font: {
                            size: 14 
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        precision: 0 
                    }, 
                    title: {
                        display: true,
                        text: 'Times solved', // Label for y-axis
                        font: {
                            size: 14 
                        }
                    }
                }
            }
        }
    });
}