const {Builder, By, Key, until} = require('selenium-webdriver');
const Trie = require('./trie');
const testWords = require('./data/testwords'); 
const words = require('./data/words'); 

const BROWSER = 'chrome';
const FIRST_GUESS = 'alien';
const HARD_MODE = true;
const SECOND_GUESS = 'tours';
const WORDLE_URL = 'https://octokatherine.github.io/word-master/';
const WORD_SIZE = 5;

// CSS class names for correct (green), partial (yellow), and wrong (gray) letters.
const Guess = {
    GREEN: 'nm-inset-n-green',
    YELLOW: 'nm-inset-yellow-500',
    GRAY: 'nm-inset-n-gray',
};

// 5 letter array containing correct letter placements
let correctLetters;
// Solution found or ran out of ugesses 
let gameOver;
// Map mapping found letters to the indices that they were misplaced in.
let partialLetters;
// The current row we are on
let rowNum;
// Trie of all possible words
let trie;
// Set of wrong letters after the current guess
let wrongLetters;

// Main execution function
(async function main() {
    let driver = await new Builder().forBrowser(BROWSER).build();
    // while (true) {
        initializeState();
        // getLetterOccurrences();
        // try {
            await driver.get(WORDLE_URL);
            await skipHowToPlay(driver);
            await makeGuess(driver, FIRST_GUESS);
            if (HARD_MODE) {
                // while (!gameOver) {
                    await makeGuess(driver, genNextGuess());
                // }

            } else {
                await makeGuess(driver, SECOND_GUESS);
                genNextGuess();
            }
        //     if (!gameOver) {
        //         await makeGuess(driver, SECOND_GUESS);
        //         while (!gameOver) {
        //             await makeGuess(driver, genNextGuess());
        //         }
        //     }
        // } catch (e) {
        //     console.log(e);
        // } finally {
        //     setTimeout(async () => {
        //         await driver.quit();
        //     }, 10000);
        // }
    // }
})();

// Makes a guess given "guess". Updates correctLetters, partialLetters, and wrongLetters
// with our new information.
async function makeGuess(driver, guess) {
    let element = driver.switchTo().activeElement();
    for (let i = 0; i < WORD_SIZE; i++) { // Individually sends keys so browser keeps up.
        await element.sendKeys(guess[i]);
    }
    element.sendKeys(Key.RETURN);
    let solutionFound = true; // stays true if only correct letters are found
    for (let i = 0; i < WORD_SIZE; i++) {
        let firstRowGuess = await driver.findElement(By.css('.grid > span:nth-child(' + (rowNum * 5 + i + 1)));
        let cName = await firstRowGuess.getAttribute("class");
        let letter = (await firstRowGuess.getAttribute('textContent')).toLowerCase();

        if (cName.startsWith(Guess.GRAY)) {
            solutionFound = false;
            wrongLetters.add(letter);
        } else if (cName.startsWith(Guess.YELLOW)) {
            solutionFound = false;
            if (partialLetters.has(letter)) {
                partialLetters.get(letter).push(i);
            } else {
                partialLetters.set(letter, [i]);
            }
        } else if (cName.startsWith(Guess.GREEN)) {
            correctLetters[i] = letter;
        }
    }
    if (solutionFound || (!solutionFound && rowNum === 5)) {
        gameOver = true;
    }
    // printState();
    rowNum++;
}

// Skips how to play by clicking on x button
async function skipHowToPlay(driver) {
    try {
        await driver.findElement(By.css('button.absolute')).click();  
    } catch (_) { }
}

// ** Utils ** //
function genNextGuess() {
    // filter trie of wrong letters and partial letters (in wrong index)
    trie.removeIfContains(wrongLetters);
    wrongLetters.clear();
    trie.removeInvalidLetterIndices(partialLetters);

    let allWords = trie.find('');
    let rankings = getLetterRanking();
    let bestWord = '';
    let bestScore = 0;
    allWords.forEach(word => {
        let rank = 0;
        let used = new Set();
        for (let i = 0; i < WORD_SIZE; i++) {
            if (!used.has(word[i])) {
                rank += rankings.indexOf(word[i]);
                used.add(word[i]);
            }
        }
        if (rank > bestScore) {
            bestWord = word;
            bestScore = rank;
        }
    });
    console.log(bestWord);
    
    return 'alien';
}

// Returns a map with the letters left in the trie as the keys,
// and their frequencies as their corresponding values
function getLetterOccurrences() {
    let map = new Map();
    let array = trie.find('');
    array.forEach(word => {
        for (let i = 0; i < WORD_SIZE; i++) {
            if (map.has(word[i])) {
                map.set(word[i], map.get(word[i]) + 1);
            } else {
                map.set(word[i], 1);
            }
        }
    });
    return map;
}

// Returns a sorted list of the letters in their optimal frequency order
// Omits partial letters and correct letters
function getLetterRanking() {
    let letters = [];
    let map = getLetterOccurrences();
    // Push all letters into the letter array
    map.forEach((_, k) => { 
        if (!partialLetters.has(k) && !correctLetters.includes(k))
            letters.push(k); 
    });
    // Sort all the letters by their frequency in remaining trie
    letters.sort((a, b) => { return map.get(a) - map.get(b); });
    return letters;
}

// Initialize state to start a new wordle game
function initializeState() {
    initializeTrie();
    correctLetters = new Array(5).fill(null);
    gameOver = false;
    partialLetters = new Map();
    rowNum = 0;
    wrongLetters = new Set();
}

function initializeTrie() {
    let data = words;
    trie = new Trie();
    for (let i = 0 ; i < data.length; i++) {
        trie.add(data[i]);
    }
}


function printState() {
    console.log(correctLetters);
    console.log(partialLetters);
    console.log(wrongLetters);
}

function printTrie() {
    console.log(trie.find(''));
    // console.log(trie);
}