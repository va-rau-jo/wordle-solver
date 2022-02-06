function TrieNode(key) {
    // the "key" value will be the character in sequence
    this.key = key;
    this.parent = null;
    this.children = {};

    // check to see if the node is at the end
    this.end = false;
}

// iterates through the parents to get the word.
TrieNode.prototype.getWord = function () {
    let output = [];
    let node = this;

    while (node !== null) {
        output.unshift(node.key);
        node = node.parent;
    }

    return output.join('');
};

function Trie() {
    this.root = new TrieNode(null);
}

// inserts a word into the trie.
Trie.prototype.add = function (word) {
    let node = this.root;

    for (let i = 0; i < word.length; i++) {
        if (!node.children[word[i]]) {
            node.children[word[i]] = new TrieNode(word[i]);
            node.children[word[i]].parent = node;
        }
        node = node.children[word[i]];
        if (i == word.length - 1) {
            node.end = true;
        }
    }
};

Trie.prototype.contains = function (word) {
    let node = this.root;

    for (let i = 0; i < word.length; i++) {
        if (node.children[word[i]]) {
            node = node.children[word[i]];
        } else {
            return false;
        }
    }
    return node.end;
};

// returns every word with given prefix
Trie.prototype.find = function (prefix) {
    let node = this.root;
    let output = [];

    for (let i = 0; i < prefix.length; i++) {
        if (node.children[prefix[i]]) {
            node = node.children[prefix[i]];
        } else {
            return output;
        }
    }
    findAllWords(node, output);
    return output;
};

// recursive function to find all words in the given node.
function findAllWords(node, arr) {
    // base case, if node is at a word, push to output
    if (node.end) {
        arr.unshift(node.getWord());
    }

    // iterate through each children, call recursive findAllWords
    for (let child in node.children) {
        findAllWords(node.children[child], arr);
    }
}

//  -- Custom methods for this wordle solver -- //

/*
  Recursively deletes every entry that contains a letter in wrongLetters, unless that
  letter is in the right spot and is not in presentLetters.
  (Guessing 'amass' could return a correct 'a' and a wrong 'a')
  meaning there is only one a in the word, so don't remove words with 1 a.

  @param wrongLetters A set of letters to remove on sight
  @param correctLetters A 5 letter array of letters in the right positions
  @param presentLetters A map mapping correct letters to their incorrect positions
*/
Trie.prototype.removeIfContains = function (wrongLetters, correctLetters, presentLetters) {
    let helper = function (node, index) {
        if (
            wrongLetters.has(node.key) &&
            node.key !== correctLetters[index] &&
            !presentLetters.has(node.key)
        ) {
            delete node.parent.children[node.key];
        } else {
            const keys = Object.keys(node.children);
            if (keys.length > 0) {
                for (let i = 0; i < keys.length; i++) {
                    helper(node.children[keys[i]], index + 1);
                }
            }
        }
    };
    helper(this.root, -1);
};

/*
  Removes any word that does not contain the correct letters in the correct spot
  or does not contain present letters in any spot.

  @param correctLetters A 5 letter array containing the correct letters in the correct spots
  @param presentLetters A map of presently correct letters to their invalid indices
  @return An array of the remaining words after filtering.
*/
Trie.prototype.removeIfDoesNotContain = function (correctLetters, presentLetters) {
    const remaining = [];
    // @param lastOneChildParent is the last ancestor with 1 child. When deleting a word
    // that doesn't contain a present letter, we want to delete up the trie as high as possible.
    // @param lastOneChildParentIndex is the index of the parent relative to our word.
    let helper = function (node, lastOneChildParent, lastOneChildParentIndex, index, arr) {
        if (node.end) {
            let word = node.getWord();
            // the word is still valid
            let valid = true;
            // find each letter in present letters. If not, word is invalid
            for (let [k, v] of presentLetters) {
                let letterFound = false;
                for (let i = 0; i < word.length; i++) {
                    // letter found: not in invalid index, not in correct letters
                    // if the letter is both in correctLetters and presentLetters, we need
                    // the duplicated letter in our word
                    if (word[i] === k) {
                        // && !v.includes(i) && correctLetters[i] !== word[i]) {
                        letterFound = true;
                        break;
                    }
                }
                if (!letterFound) {
                    // console.log('didnt find letter ' + k);
                    valid = false;
                    break;
                }
            }
            if (!valid) {
                // console.log('NOT VALID: ' + node.getWord());
                delete lastOneChildParent.children[word[lastOneChildParentIndex]];
            } else {
                arr.push(node.getWord());
            }
        } else {
            const keys = Object.keys(node.children);
            for (let i = 0; i < keys.length; i++) {
                if (correctLetters[index] !== null && keys[i] !== correctLetters[index]) {
                    delete node.children[keys[i]];
                } else {
                    lastOneChildParent = keys.length > 1 ? node : lastOneChildParent;
                    lastOneChildParentIndex = keys.length > 1 ? index : lastOneChildParentIndex;
                    helper(
                        node.children[keys[i]],
                        lastOneChildParent,
                        lastOneChildParentIndex,
                        index + 1,
                        arr
                    );
                }
            }
        }
    };
    helper(this.root, this.root, 0, 0, remaining);
    return remaining;
};

/*
  Recursively removes words if they have the given letters in an invalid index

  @param presentLetters A map of presently correct letters to their invalid indices
  @returns the words that remain after removing
*/
Trie.prototype.removeInvalidLetterIndices = function (presentLetters) {
    let helper = function (node, index) {
        if (presentLetters.has(node.key) && presentLetters.get(node.key).includes(index)) {
            delete node.parent.children[node.key];
        } else {
            const keys = Object.keys(node.children);
            if (keys.length > 0) {
                for (let i = 0; i < keys.length; i++) {
                    helper(node.children[keys[i]], index + 1);
                }
            }
        }
    };
    helper(this.root, -1);
};

module.exports = Trie;
