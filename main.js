const { Builder, By, Key } = require('selenium-webdriver');

const BrowserDriver = require('./browserDriver');
const Trie = require('./trie');
const answers = require('./data/answers');
const testWords = require('./data/testwords');
const words = require('./data/words');

// const FIRST_GUESS = 'alien';
const FIRST_GUESS = 'rates';
const HARD_MODE = true;
const SECOND_GUESS = 'tours';
const WORD_SIZE = 5;

// CSS class names for correct (green), partial (yellow), and wrong (gray) letters.
const Guess = {
    GREEN: 'nm-inset-n-green',
    YELLOW: 'nm-inset-yellow-500',
    GRAY: 'nm-inset-n-gray',
};

let highestStreak = 0;
let currentStreak = 0;

// 5 letter array containing correct letter placements
let correctLetters;
// BrowserDriver that interacts with the browser
let driver = new BrowserDriver();
// Map mapping found letters to the indices that they were misplaced in.
let partialLetters;
// The current row we are on
let rowNum;
// Trie of all possible words
let trie;
// Set of wrong letters after the current guess
let wrongLetters;
let loop = true;
const timeout = function (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

// Main execution function
(async function main() {
    await driver.init();
    await driver.skipHowToPlay();
    while (loop) {
        initializeState();
        try {
            await makeGuess(FIRST_GUESS);
            if (HARD_MODE) {
                while (!(await driver.isGameOver())) {
                    await makeGuess(genNextGuess());
                }
            } else {
                if (!(await driver.isGameOver())) {
                    await makeGuess(SECOND_GUESS);
                    while (!(await driver.isGameOver())) {
                        await makeGuess(genNextGuess());
                    }
                }
            }
            if (await driver.isWordCorrect()) {
                currentStreak++;
                if (currentStreak > highestStreak) {
                    highestStreak = currentStreak;
                }
                await driver.clickPlayAgain();
            } else {
                currentStreak = 0;
                console.log('STREAK: ' + highestStreak);
                printState();
                loop = false;
            }
        } catch (e) {
            loop = false;
            console.log(e);
            // await driver.quit();
        } finally {
            // setTimeout(async () => {
            //     await driver.quit();
            // }, 10000);
        }
    }
})();

// Makes a guess given "guess". Updates correctLetters, partialLetters, and wrongLetters
// with our new information.
async function makeGuess(guess) {
    let element = await driver.getActiveElement();
    for (let i = 0; i < WORD_SIZE; i++) {
        // Individually sends keys so browser keeps up.
        await element.sendKeys(guess[i]);
    }
    element.sendKeys(Key.RETURN);
    for (let i = 0; i < WORD_SIZE; i++) {
        let firstRowGuess = await driver.getLetterByIndex(rowNum * 5 + i + 1);
        let cName = await firstRowGuess.getAttribute('class');
        let letter = (await firstRowGuess.getAttribute('textContent')).toLowerCase();

        if (cName.startsWith(Guess.GRAY)) {
            wrongLetters.add(letter);
        } else if (cName.startsWith(Guess.YELLOW)) {
            if (partialLetters.has(letter)) {
                partialLetters.get(letter).push(i);
            } else {
                partialLetters.set(letter, [i]);
            }
        } else if (cName.startsWith(Guess.GREEN)) {
            correctLetters[i] = letter;
        }
    }
    rowNum++;
    await timeout(500);
}

// ** Utils ** //
function genNextGuess() {
    // filter trie of wrong letters and partial letters (in wrong index)

    // jaded
    // alien -> dares -> fated -> waved -> caged -> maxed -> jaded
    // dazed
    // rates -> laced -> waved
    wrongLetters = new Set();
    wrongLetters.add('r');
    wrongLetters.add('t');
    wrongLetters.add('e');
    // wrongLetters.add('o');
    // wrongLetters.add('n');
    // wrongLetters.add('v');
    // wrongLetters.add('n');
    // wrongLetters.add('m');
    // wrongLetters.add('f');
    // wrongLetters.add('c');
    // wrongLetters.add('g');
    // wrongLetters.add('m');
    // wrongLetters.add('x');
    // correctLetters = [null, null, null, null, null];
    correctLetters = [null, null, null, null, 's'];
    partialLetters = new Map();
    partialLetters.set('a', [1]);
    // partialLetters.set('l', [0]);
    // partialLetters.set('d', [2]);
    // partialLetters.set('e', [1, 3, 4]);
    // partialLetters.set('n', [2, 3, 4]);

    let t = trie.removeIfContains(wrongLetters, correctLetters, partialLetters);
    // console.log(t.indexOf('entry'));
    wrongLetters.clear();
    t = trie.removeInvalidLetterIndices(partialLetters);
    let allWords = trie.removeIfDoesNotContain(correctLetters, partialLetters);
    partialLetters.clear();
    console.log(allWords);

    let rankings = getLetterRanking(allWords);
    let bestWord = '';
    let bestScore = -1;

    allWords.forEach((word) => {
        let rank = 0;
        let used = new Set();
        for (let i = 0; i < WORD_SIZE; i++) {
            if (!used.has(word[i])) {
                let index = rankings.indexOf(word[i]);
                rank += index === -1 ? 0 : index;
                used.add(word[i]);
            }
        }
        if (rank > bestScore) {
            bestWord = word;
            bestScore = rank;
        }
    });
    console.log(bestWord);
    return bestWord;
}

// Returns a map with the letters left in the trie as the keys,
// and their frequencies as their corresponding values
function getLetterOccurrences(words) {
    let map = new Map();
    words.forEach((word) => {
        for (let i = 0; i < WORD_SIZE; i++) {
            let letter = word[i];
            if (correctLetters[i] !== letter) {
                if (map.has(letter)) {
                    map.set(letter, map.get(letter) + 1);
                } else {
                    map.set(letter, 1);
                }
            }
        }
    });
    return map;
}

// Returns a sorted list of the letters in their optimal frequency order
// Omits partial letters and correct letters
function getLetterRanking(words) {
    let letters = [];
    let map = getLetterOccurrences(words);
    // Push all letters into the letter array
    map.forEach((_, k) => {
        if (!partialLetters.has(k)) letters.push(k);
    });
    // Sort all the letters by their frequency in remaining trie
    letters.sort((a, b) => {
        return map.get(a) - map.get(b);
    });
    return letters;
}

// Initialize state to start a new wordle game
function initializeState() {
    initializeTrie();
    correctLetters = new Array(5).fill(null);
    partialLetters = new Map();
    rowNum = 0;
    wrongLetters = new Set();
}

function initializeTrie() {
    let data = answers;
    trie = new Trie();
    for (let i = 0; i < data.length; i++) {
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
