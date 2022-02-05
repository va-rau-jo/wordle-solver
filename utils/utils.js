const USE_MOST_FREQUENT_OCCURRING = false;
const USE_RARE_LETTERS = true;

const occurrences = require('../data/ocurrences');

module.exports.filterTrie = function (trie, correct, partial, wrong) {
    // console.log('STEP 0');
    // console.log(trie.find(''));
    trie.removeIfContains(wrong, correct, partial);
    // console.log('STEP 1');
    // console.log(trie.find(''));
    t = trie.removeInvalidLetterIndices(partial);
    // console.log('STEP 2');
    // console.log(trie.find(''));
    let remaining = trie.removeIfDoesNotContain(correct, partial);
    // console.log('STEP 3');
    // console.log(remaining);
    wrong.clear();
    partial.clear();
    return remaining;
};

// Returns a guess in hard mode (always reuse previous information)
module.exports.genGuess = function (allWords, remainingWords, correct, partial, allPartial) {
    if (remainingWords.length <= 2) {
        return remainingWords[0];
    }

    let occurrences = getLetterOccurrences(remainingWords, correct, partial);
    let rankings = getLetterRanking(remainingWords, correct, partial).reverse();
    let bestWord = '';
    let bestScore = -1000000;

    allWords.forEach((word) => {
        let rank = 0;
        let used = new Set();
        for (let i = 0; i < word.length; i++) {
            let letterPosGuessed = allPartial.has(word[i]) && allPartial.get(word[i]).includes(i);
            if (!letterPosGuessed && !used.has(word[i]) && rankings.includes(word[i])) {
                used.add(word[i]);
                if (
                    occurrences.get(word[i]) <= remainingWords.length / 2 ||
                    remainingWords.length < 6
                ) {
                    rank += occurrences.get(word[i]);
                }
            }
        }
        if (rank > bestScore) {
            bestWord = word;
            bestScore = rank;
        }
    });
    return bestWord;
};

// Returns a guess in hard mode (always reuse previous information)
module.exports.genGuessHardMode = function (trie, correct, partial, wrong) {
    let remaining = this.filterTrie(trie, correct, partial, wrong);

    if (USE_MOST_FREQUENT_OCCURRING) {
        return genGuessHardModeMostFreqOccurring(remaining, correct, partial);
    } else if (USE_RARE_LETTERS) {
        return genGuessHardModeRareLetters(remaining, correct, partial);
    }
};

function genGuessHardModeRareLetters(words, correct, partial) {
    let rankings = getLetterRanking(words, correct, partial);
    let bestWord = '';
    let bestScore = -100;

    console.log(rankings);

    words.forEach((word) => {
        let rank = 0;
        let used = new Set();
        for (let i = 0; i < word.length; i++) {
            if (used.has(word[i])) {
                rank -= 5;
            } else {
                //} if (!'aeiou'.includes(word[i])) {
                let index = rankings.indexOf(word[i]);
                rank += index === -1 ? 0 : index;
                used.add(word[i]);
            }
            // } else {
            //     used.add(word[i]);
            // }
        }
        if (rank > bestScore) {
            bestWord = word;
            bestScore = rank;
        }
    });

    console.log('BEST WORD: ' + bestWord);
    return bestWord;
}

function genGuessHardModeMostFreqOccurring(words, correct, partial) {
    let rankings = getLetterRanking(words, correct, partial);
    let bestWord = '';
    let bestScore = -1;

    words.forEach((word) => {
        let rank = 0;
        let used = new Set();
        for (let i = 0; i < word.length; i++) {
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

    console.log('BEST WORD: ' + bestWord);
    return bestWord;
}

// Returns a map with the letters left in the trie as the keys,
// and their frequencies as their corresponding values
function getLetterOccurrences(words, correct) {
    let map = new Map();
    words.forEach((word) => {
        for (let i = 0; i < word.length; i++) {
            let letter = word[i];
            if (correct[i] !== letter) {
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
function getLetterRanking(words, correct, partial) {
    let letters = [];
    let map = getLetterOccurrences(words, correct);
    // Push all letters into the letter array
    map.forEach((_, k) => {
        if (!partial.has(k)) letters.push(k);
    });
    // Sort all the letters by their frequency in remaining trie
    letters.sort((a, b) => {
        if (map.get(a) !== map.get(b)) {
            return map.get(a) - map.get(b);
        } else {
            return occurrences.indexOf(b) - occurrences.indexOf(a);
        }
    });
    return letters;
}

module.exports.timeout = function (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
