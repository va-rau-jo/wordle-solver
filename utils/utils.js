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
    // wrong.clear();
    partial.clear();

    console.log('COMPLETING');
    if (remaining.length > 0) {
        let removed = 0;
        let common = remaining[0];
        for (let i = 1; i < remaining.length; i++) {
            for (let j = 0; j < remaining[i].length; j++) {
                if (removed === 5) {
                    break;
                } else if (common[j] !== '.' && remaining[i][j] !== common[j]) {
                    common = common.substring(0, j) + '.' + common.substring(j + 1);
                    removed++;
                }
            }
        }

        if (common.length > 0) {
            for (let i = 0; i < common.length; i++) {
                if (common[i] !== '.') {
                    correct[i] = common[i];
                }
            }
        }
    }

    return remaining;
};

// Returns a guess in hard mode (always reuse previous information)
module.exports.genGuess = function (
    allWords,
    remainingWords,
    correct,
    partial,
    allPartial,
    roundsLeft
) {
    if (remainingWords.length <= roundsLeft) {
        return remainingWords[0];
    }

    let occurrences = getLetterOccurrences(remainingWords, correct, partial);
    let rankings = getLetterRanking(remainingWords, correct, partial).reverse();
    let bestWord = '';
    let bestScore = -1000000;

    // console.log(remainingWords);
    // console.log(correct);
    // console.log(occurrences);
    // console.log(rankings);

    allWords.forEach((word) => {
        let rank = 0;
        let used = new Set();
        for (let i = 0; i < word.length; i++) {
            // We have guessed this letter at this same position before, so don't do it again (wasted info)
            let letterPosGuessed = allPartial.has(word[i]) && allPartial.get(word[i]).includes(i);
            // first m in mummy is only helpful if tried in the first slot, otherwise it might be incating the other m's
            let validSlotNeeded = correct.includes(word[i]);

            if (
                !letterPosGuessed &&
                !used.has(word[i]) &&
                rankings.includes(word[i]) &&
                (!validSlotNeeded || correct[i] == null)
            ) {
                used.add(word[i]);
                let useMostAlways = roundsLeft > 2 || remainingWords.length < 6;
                if (
                    useMostAlways ||
                    (!correct.includes(word[i]) &&
                        occurrences.get(word[i]) <= remainingWords.length / 2)
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
