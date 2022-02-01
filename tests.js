const Trie = require('./utils/trie');
const answers = require('./data/answers');
const testWords = require('./data/testwords');
const utils = require('./utils/utils');

const HARD_MODE = true;
const FIRST_GUESS = 'rates';
const NUM_ROUNDS = 6;

// 5 letter array containing correct letter placements
let correctLetters;
// Map mapping found letters to the indices that they were misplaced in.
let partialLetters;
// Trie of all possible words
let trie;
// Set of wrong letters after the current guess
let wrongLetters;

// Main execution function
(function main() {
    let data = testWords;
    console.log(data);
    for (let word of data) {
        initializeState(data);
        word = 'acabb';
        console.log('WORD: ' + word);

        if (HARD_MODE) {
            mockGuess(FIRST_GUESS, word);
            for (let i = 1; i < NUM_ROUNDS; i++) {
                mockGuess(utils.genGuess(trie, correctLetters, partialLetters, wrongLetters), word);
                if (isCorrect()) break;
            }
        }

        if (isCorrect()) {
            console.log(word + ' found!');
        } else {
            console.log(word + ' NOT FOUND');
            break;
        }
    }
})();

function isCorrect() {
    return !correctLetters.includes(null);
}

function mockGuess(guess, answer) {
    if (!guess) {
        console.log('NO GUESS MADE FOR ' + answer);
    } else {
        console.log('guessing ' + guess);
        const used = new Map();
        for (let i = 0; i < guess.length; i++) {
            const letter = guess[i];
            if (letter === answer[i]) {
                correctLetters[i] = letter;
                if (used.has(letter)) {
                    used.set(letter, used.get(letter) + 1);
                } else {
                    used.set(letter, 1);
                }
            }
        }
        for (let i = 0; i < guess.length; i++) {
            const letter = guess[i];
            if (letter !== answer[i]) {
                let count = countOccurrences(answer, letter);
                console.log(answer + ' ' + letter);
                console.log(count);
                if (used.has(letter) && used.get(letter) < count) {
                    if (partialLetters.has(letter)) {
                        partialLetters.get(letter).push(i);
                    } else {
                        partialLetters.set(letter, [i]);
                    }
                } else {
                    wrongLetters.add(letter);
                }
            }
        }
        printState();
    }
}

function countOccurrences(word, letter) {
    let count = 0;
    for (let i = 0; i < word.length; i++) {
        if (word[i] === letter) {
            count++;
        }
    }
    return count;
}

// Initialize state to start a new wordle game
function initializeState(data) {
    initializeTrie(data);
    correctLetters = new Array(5).fill(null);
    partialLetters = new Map();
    rowNum = 0;
    wrongLetters = new Set();
}

function initializeTrie(data) {
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
