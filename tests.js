const Trie = require('./utils/trie');
const words = require('./data/answers');
const utils = require('./utils/utils');

const HARD_MODE = false;
const NUM_ROUNDS = 6;

// 5 letter array containing correct letter placements
let correctLetters;
// Map mapping found letters to the indices that they were misplaced in.
let partialLetters;
// Aggregated partial letters for all rounds
let allPartialLetters;
// Trie of all possible words
let trie;
// Set of wrong letters after the current guess
let wrongLetters;

// Main execution function
(function main() {
    let wordInputs = words; // input space
    let wordsToTest; // specific words to test (default is test all the input words)
    if (process.argv.length > 2) {
        // can set command line arguments to test specific words
        wordsToTest = process.argv.slice(2)[0].split(',');
    } else {
        wordsToTest = words;
    }
    for (let word of wordsToTest) {
        initializeState(wordInputs);
        console.log('WORD: ' + word);

        if (HARD_MODE) {
            mockGuess('alien', word);
            for (let i = 1; i < NUM_ROUNDS; i++) {
                mockGuess(
                    utils.genGuessHardMode(trie, correctLetters, partialLetters, wrongLetters),
                    word
                );
                if (isCorrect()) break;
            }
        } else {
            mockGuess('alien', word);
            utils.filterTrie(trie, correctLetters, partialLetters, wrongLetters);
            if (!isCorrect()) {
                // mockGuess('tours', word);
                // utils.filterTrie(trie, correctLetters, partialLetters, wrongLetters);
                // if (!isCorrect()) {
                for (let i = 1; i < NUM_ROUNDS; i++) {
                    let remaining = utils.filterTrie(
                        trie,
                        correctLetters,
                        partialLetters,
                        wrongLetters
                    );
                    mockGuess(
                        utils.genGuess(
                            wordInputs,
                            remaining,
                            correctLetters,
                            partialLetters,
                            allPartialLetters,
                            NUM_ROUNDS - i
                        ),
                        word
                    );
                    if (isCorrect()) break;
                }
            }
            // }
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
        const correct = new Map();
        for (let i = 0; i < guess.length; i++) {
            const l = guess[i];
            if (l === answer[i]) {
                correctLetters[i] = l;
                mapAppend(correct, l);
            }
        }
        // console.log(correct);
        const used = new Map();
        for (let i = 0; i < guess.length; i++) {
            const l = guess[i];
            if (allPartialLetters.has(l) && !allPartialLetters.get(l).includes(i)) {
                allPartialLetters.get(l);
            } else if (!allPartialLetters.has(l)) {
                allPartialLetters.set(l, [i]);
            }

            if (l !== answer[i]) {
                // "Uses" left of our letter. Removes correctly used instances of the letter
                // and any partial uses we've made so far
                let count = countOccurrences(answer, l) - (mapGet(used, l) + mapGet(correct, l));
                if ((!used.has(l) && count > 0) || used.get(l) < count) {
                    if (partialLetters.has(l)) {
                        partialLetters.get(l).push(i);
                    } else {
                        partialLetters.set(l, [i]);
                    }
                    mapAppend(used, l);
                } else {
                    wrongLetters.add(l);
                }
            }
        }
    }
}

// Helper function to return 0 if the key is not present in the map, or return the key's value.
// This logic was being used all over the place
function mapGet(map, key) {
    if (map.has(key)) {
        return map.get(key);
    }
    return 0;
}

function mapAppend(map, val) {
    if (map.has(val)) {
        map.set(val, map.get(val) + 1);
    } else {
        map.set(val, 1);
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
    allPartialLetters = new Map();
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
    console.log(allPartialLetters);
    console.log(correctLetters);
    console.log(partialLetters);
    console.log(wrongLetters);
}
