module.exports.genGuess = function (trie, correct, partial, wrong) {
    // filter trie of wrong letters and partial letters (in wrong index)

    // jaded
    // alien -> dares -> fated -> waved -> caged -> maxed -> jaded
    // dazed
    // rates -> laced -> waved
    // wrong = new Set();
    // wrong.add('r');
    // wrong.add('t');
    // correct = [null, null, null, null, null];
    // correct = [null, null, null, null, 's'];
    // partial = new Map();
    // partial.set('a', [1]);
    // partial.set('l', [0]);

    console.log('1');
    console.log(trie.find(''));
    let t = trie.removeIfContains(wrong, correct, partial);
    wrong.clear();
    t = trie.removeInvalidLetterIndices(partial);
    let allWords = trie.removeIfDoesNotContain(correct, partial);
    partial.clear();
    console.log(allWords);

    let rankings = getLetterRanking(allWords, correct, partial);
    let bestWord = '';
    let bestScore = -1;

    allWords.forEach((word) => {
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
    console.log(bestWord);
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
        return map.get(a) - map.get(b);
    });
    return letters;
}

module.exports.timeout = function (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
