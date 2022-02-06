const occurrences = require('../data/ocurrences');

module.exports.filterTrie = function (trie, correct, present, wrong) {
    trie.removeIfContains(wrong, correct, present);
    t = trie.removeInvalidLetterIndices(present);
    let remaining = trie.removeIfDoesNotContain(correct, present);
    present.clear();

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
    present,
    allGuesses,
    roundsLeft
) {
    if (remainingWords.length <= roundsLeft) {
        return remainingWords[0];
    }

    let occurrences = getLetterOccurrences(remainingWords, correct, present);
    let rankings = getLetterRanking(remainingWords, correct, present).reverse();
    let bestWord = '';
    let bestScore = -1000000;

    allWords.forEach((word) => {
        let rank = 0;
        let used = new Set();
        for (let i = 0; i < word.length; i++) {
            // We have guessed this letter at this same position before, so don't do it again (wasted info)
            let letterPosGuessed = allGuesses.has(word[i]) && allGuesses.get(word[i]).includes(i);
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
// Omits present letters and correct letters
function getLetterRanking(words, correct, present) {
    let letters = [];
    let map = getLetterOccurrences(words, correct);
    // Push all letters into the letter array
    map.forEach((_, k) => {
        if (!present.has(k)) letters.push(k);
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
