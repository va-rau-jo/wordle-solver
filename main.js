const { Key } = require('selenium-webdriver');
require('chromedriver');

const BrowserDriver = require('./utils/browserDriver');
const Trie = require('./utils/trie');
const words = require('./data/answers');
const utils = require('./utils/utils');

const NUM_ROUNDS = 6;

// CSS class names for correct (green), present (yellow), and wrong (gray) letters.
const Guess = {
    GREEN: 'nm-inset-n-green',
    YELLOW: 'nm-inset-yellow-500',
    GRAY: 'nm-inset-n-gray',
};

// 5 letter array containing correct letter placements
let correct;
// BrowserDriver that interacts with the browser
let driver = new BrowserDriver();
// Map mapping found letters to the indices that they were misplaced in
let present;
// All guesses we've made so far. Maps letter to a map with the indices we guessed at
let allGuesses;
// The current row we are on
let rowNum;
// Trie of all possible words
let trie;
// Set of wrong letters after the current guess
let wrong;

// Main execution function
(async function main() {
    await driver.init();
    await driver.skipHowToPlay();
    let loop = true;
    while (loop) {
        initializeState();
        try {
            await makeGuess('alien');
            utils.filterTrie(trie, correct, present, wrong);
            if (!(await driver.isWordCorrect())) {
                for (let i = 1; i < NUM_ROUNDS; i++) {
                    let remaining = utils.filterTrie(trie, correct, present, wrong);
                    await makeGuess(
                        utils.genGuess(
                            words,
                            remaining,
                            correct,
                            present,
                            allGuesses,
                            NUM_ROUNDS - i
                        )
                    );
                    if (await driver.isWordCorrect()) break;
                }
            }
            await utils.timeout(1000);
            await driver.clickPlayAgain();
        } catch (_) {
            loop = false;
        }
    }
})();

// Makes a guess given "guess". Updates correctLetters, presentLetters, and wrongLetters
// with our new information.
async function makeGuess(guess) {
    let element = await driver.getActiveElement();
    for (let i = 0; i < guess.length; i++) {
        await element.sendKeys(guess[i]); // Individually sends keys so browser keeps up.
    }
    element.sendKeys(Key.RETURN);
    for (let i = 0; i < guess.length; i++) {
        let firstRowGuess = await driver.getLetterByIndex(rowNum * 5 + i + 1);
        let cName = await firstRowGuess.getAttribute('class');
        let letter = (await firstRowGuess.getAttribute('textContent')).toLowerCase();

        if (allGuesses.has(letter) && !allGuesses.get(letter).includes(i)) {
            allGuesses.get(letter).push(i);
        } else if (!allGuesses.has(letter)) {
            allGuesses.set(letter, [i]);
        }

        if (cName.startsWith(Guess.GRAY)) {
            wrong.add(letter);
        } else if (cName.startsWith(Guess.YELLOW)) {
            if (present.has(letter)) {
                present.get(letter).push(i);
            } else {
                present.set(letter, [i]);
            }
        } else if (cName.startsWith(Guess.GREEN)) {
            correct[i] = letter;
        }
    }
    rowNum++;
    await utils.timeout(500);
}

// Initialize state to start a new wordle game
function initializeState() {
    initializeTrie();
    correct = new Array(5).fill(null);
    present = new Map();
    allGuesses = new Map();
    rowNum = 0;
    wrong = new Set();
}

function initializeTrie() {
    let data = words;
    trie = new Trie();
    for (let i = 0; i < data.length; i++) {
        trie.add(data[i]);
    }
}
