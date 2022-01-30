function TrieNode(key) {
    // the "key" value will be the character in sequence
    this.key = key;
    this.parent = null;
    this.children = {};
    
    // check to see if the node is at the end
    this.end = false;
  }
  
  // iterates through the parents to get the word.
  TrieNode.prototype.getWord = function() {
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
  Trie.prototype.add = function(word) {
    let node = this.root;
    
    for(let i = 0; i < word.length; i++) {
      if (!node.children[word[i]]) {
        node.children[word[i]] = new TrieNode(word[i]);
        node.children[word[i]].parent = node;
      }
      node = node.children[word[i]];
      if (i == word.length-1) {
        node.end = true;
      }
    }
  };
  
  Trie.prototype.contains = function(word) {
    let node = this.root;
    
    for(let i = 0; i < word.length; i++) {
      if (node.children[word[i]]) {
        node = node.children[word[i]];
      } else {
        return false;
      }
    }
    return node.end;
  };
  
  // returns every word with given prefix
  Trie.prototype.find = function(prefix) {
    let node = this.root;
    let output = [];
    
    for(let i = 0; i < prefix.length; i++) {
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

  // Recursively deletes every entry containg the given letters
  // @param letters A set of letters to remove on sight
  // @returns the words that remain after removing
  Trie.prototype.removeIfContains = function(letters) {
    const remaining = [];
    let helper = function(node, arr) {
      if (letters.has(node.key)) {
        delete node.parent.children[node.key];
      } else {
        const keys = Object.keys(node.children);
        if (keys.length === 0) {
          arr.push(node.getWord());
        } else {
          for (let i = 0; i < keys.length; i++) {
            helper(node.children[keys[i]], arr);
          }
        }
      }
    };
    helper(this.root, remaining);
    return remaining;
  };

  // Recursively removes words if they have the given letter in an invalid index
  // @param letters A set of letters to remove on sight
  // @returns the words that remain after removing
  Trie.prototype.removeInvalidLetterIndices = function(partialLetters) {
    const remaining = [];
    let helper = function(node, index, arr) {
      if (partialLetters.has(node.key) && partialLetters.get(node.key).includes(index)) {
        delete node.parent.children[node.key];
      } else {
        const keys = Object.keys(node.children);
        if (keys.length === 0) {
          arr.push(node.getWord());
        } else {
          for (let i = 0; i < keys.length; i++) {
            helper(node.children[keys[i]], index + 1, arr);
          }
        }
      }
    };
    helper(this.root, -1, remaining);
    return remaining;
  }

module.exports = Trie;