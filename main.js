const { Builder, By, Key } = require('selenium-webdriver');
require('chromedriver');

const BrowserDriver = require('./utils/browserDriver');
const Trie = require('./utils/trie');
const answers = require('./data/answers');
const testWords = require('./data/testwords');
const utils = require('./utils/utils');
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
                    await makeGuess(
                        utils.genGuess(trie, correctLetters, partialLetters, wrongLetters)
                    );
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
        }
    }
})();

// Makes a guess given "guess". Updates correctLetters, partialLetters, and wrongLetters
// with our new information.
async function makeGuess(guess) {
    let element = await driver.getActiveElement();
    for (let i = 0; i < WORD_SIZE; i++) {
        await element.sendKeys(guess[i]); // Individually sends keys so browser keeps up.
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
    await utils.timeout(500);
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
