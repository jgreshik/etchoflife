// Utility methods for main.js

/*
  * Global Values
*/

const textFlashColor = 'red';
const textFlashColorR = 'cyan';
const deadCellColor = 'white';
const aliveCellColor = 'black';
const dullColor = 'grey';

sessionStorage.setItem('sketchToggleKey', 'f');
sessionStorage.setItem('gameToggleKey', 'a');
sessionStorage.setItem('speedToggleKey', 's');
sessionStorage.setItem('sizeToggleKey', 'd');
sessionStorage.setItem('eraseToggleKey', 'e');
sessionStorage.setItem('clearToggleKey', 'q');
sessionStorage.setItem('menuToggleKey', 'w');
sessionStorage.setItem('stampCycleKey', 'tab');
sessionStorage.setItem('searchToggleKey', 'enter');
sessionStorage.setItem('stampAddKey', 'enter');
sessionStorage.setItem('rotateStampKey', 'r');

/*
  * Utility Classes
*/

class GameState {
  constructor(sketchToggle = new Toggle(false),
    gameToggle = new Toggle(false),
    menuToggle = new Toggle(true),
    gameStamp = 'none',
    cellSizeCycleArray = new CycleArray([32, 64, 8, 16]),
    gameFPSCycleArray = new CycleArray([4, 8, 16, 32, 64, 1, 2]),
    stampCache = new CycleArray(['none', 'cell'])) {
      this.sketchToggle = sketchToggle;
      this.gameToggle = gameToggle;
      this.menuToggle = menuToggle;
      this.gameStamp = gameStamp;
      this.cellSizeCycleArray = cellSizeCycleArray;
      this.gameFPSCycleArray = gameFPSCycleArray;
      this.stampCache = stampCache;
  }
}

class Cell {
  constructor(life = false, preview = false) {
    this.life = life;
    this.preview = preview;
  }
  die() {
    this.life = false;
  }
  live() {
    this.life = true;
  }
  getState() {
    return this.life;
  }
}

class Toggle {
  constructor(toggle_val) {
    this.toggle_val = toggle_val;
  }
  toggle() {
    if (this.toggle_val) {
      this.toggle_val = false;
    } else {
      this.toggle_val = true;
    }
  }
  get_val() {
    return this.toggle_val;
  }
}

class CycleMap {
  constructor(map) {
    this.map = map;
    this.mapR = reverseMap(map);
  }
}

class CycleArray {
  constructor(array) {
    this.dataArray = array;
    this.index = 0;
  }
  size() {
    return this.dataArray.length;
  }
  isEmpty() {
    return this.size() == 0;
  }
  remove(val) {
    const index = this.dataArray.indexOf(val);
    if (index != -1) {
      this.dataArray.splice(index, 1);
      if (this.index > index) {
        this.backward();
      } else {
        this.index = mod(this.index, this.size());
      }
    }
  }
  insert(val) {
    const index = this.dataArray.indexOf(val);
    if (index === -1) {
      const i = this.size() > 0 ? 1: 0;
      this.dataArray.splice(this.index + i, 0, val);
      this.forward();
    } else {
      this.index = mod(index, this.size());
    }
  }
  current() {
    if (this.isEmpty()) {
      return null;
    }
    return this.dataArray[this.index];
  }
  forward() {
    if (this.isEmpty()) {
      return null;
    }
    this.index+=1;
    this.index = mod(this.index, this.size());
    return this.dataArray[this.index];
  }
  backward() {
    if (this.isEmpty()) {
      return null;
    }
    this.index-= this.size() < 1 ? 0: 1;
    this.index = mod(this.index, this.size());
    return this.dataArray[this.index];
  }
}

class PriorityQueue {
  constructor(comparator = (a, b) => a > b) {
    this._heap = [];
    this._comparator = comparator;
    this.top = 0;
    this.parent = i => ((i + 1) >>> 1) - 1;
    this.left = i => (i << 1) + 1;
    this.right = i => (i + 1) << 1;
  }
  size() {
    return this._heap.length;
  }
  isEmpty() {
    return this.size() == 0;
  }
  peek() {
    return this._heap[this.top];
  }
  push(...values) {
    values.forEach(value => {
      this._heap.push(value);
      this._siftUp();
    });
    return this.size();
  }
  pop() {
    const poppedValue = this.peek();
    const bottom = this.size() - 1;
    if (bottom > this.top) {
      this._swap(this.top, bottom);
    }
    this._heap.pop();
    this._siftDown();
    return poppedValue;
  }
  replace(value) {
    const replacedValue = this.peek();
    this._heap[this.top] = value;
    this._siftDown();
    return replacedValue;
  }
  _greater(i, j) {
    return this._comparator(this._heap[i], this._heap[j]);
  }
  _swap(i, j) {
    [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]];
  }
  _siftUp() {
    let node = this.size() - 1;
    while (node > this.top && this._greater(node, this.parent(node))) {
      this._swap(node, this.parent(node));
      node = this.parent(node);
    }
  }
  _siftDown() {
    let node = this.top;
    while (
      (this.left(node) < this.size() && this._greater(this.left(node), node)) ||
      (this.right(node) < this.size() && this._greater(this.right(node), node))
    ) {
      let maxChild = (this.right(node) < this.size() && this._greater(this.right(node), this.left(node))) ? this.right(node) : this.left(node);
      this._swap(node, maxChild);
      node = maxChild;
    }
  }
}

class TypeLine {
  constructor() {
    this.dataArray = [];
  }
  size() {
    return this.dataArray.length;
  }
  push(val) {
    if (this.size() < 32) {
      this.dataArray.push(val);
    }
  }
  pop() {
    this.dataArray.pop();
  }
  bigPop() {
    this.dataArray = [];
  }
  getString() {
    return this.dataArray.join("");
  }
  clean() {
    this.dataArray = [];
    const parentElement = document.getElementById("search_type");
    if (parentElement) {
      parentElement.replaceChildren();
    }
  }
  genLine() {
    const parentElement = document.getElementById("search_type");
    if (parentElement) {
      parentElement.replaceChildren();
    }

    const typeTextWrapperElement = document.createElement("div");
    typeTextWrapperElement.id = "type_text_wrapper";
    parentElement.appendChild(typeTextWrapperElement);
    const elements = [];

    for (let c of this.dataArray) {
      const char = document.createElement("text");
      char.classList.add("text");
      if (c === ' ') {
        char.textContent = "_";
        char.style.color = deadCellColor;
      } else {
        char.textContent = c;
        char.style.color = textFlashColor;
      }
      elements.push(char);
    }

    // cursor
    const cursorChar = "_";
    const char = document.createElement("b");
    char.classList.add("text");
    char.textContent = cursorChar;
    char.style.color = aliveCellColor;
    char.classList.add("blink");
    elements.push(char);

    for (let i in elements) {
      typeTextWrapperElement.appendChild(elements[i]);
    }

  }
}

/*
  * Utility Methods
*/

const timer = ms => new Promise(res => setTimeout(res, ms))

function mod(n, m) {
  if (m == 0) {
    return 0;
  }
  return ((n % m) + m) % m;
}

function flip2dMatrix(matrix)  {

  if (matrix.length > 0) {
    const n = matrix.length;

    // reverse cols
    for (let i = 0; i < n; i++) {
      matrix[i].reverse();
    }
  }
  return matrix;
}

function rotate2dMatrix90(matrix)  {

  if (matrix.length > 0) {

    const m = matrix[0].length;
    const n = matrix.length;

    let result = Array(m).fill().map(entry => Array(n))

    // transpose matrix
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        result[i][j] = matrix[j][i];
      }
    }
    // reverse rows
    for (let i = 0; i < m; i++) {
      result[i].reverse();
    }

    return result;
  } else {
    return matrix;
  }
}

function checkEventIdentifierUpper(event, identifier) {
  if (event.key === sessionStorage.getItem(identifier)
    || event.key === sessionStorage.getItem(identifier).toUpperCase()) {
    return true;
  } else {
    return false;
  }
}

function reverseMap(map) {
  let result = new Map();
  for(let pair of map) {
    result.set(pair[1],pair[0]);
  }
  return result;
}

function genCycleMap(map) {
  let result = new Map();
  let firstKey = map.keys().next().value;
  if (firstKey != undefined) {
    // first map value
    let last = '';
    for (let i of map.keys()) {
      if (i != firstKey) {
        result.set(last, i);
      }
      last = i;
    }
    result.set(last, firstKey)
  }
  return result;
}

function regexSubStringsIndex(substring, string) {
  let indexArray = [];
  if (substring.length === 0) {
    indexArray.push[0];
    return indexArray;
  }
  if (string.length === 0) {
    return null;
  }
  let tempS = string.toLowerCase();
  for (let c of substring.toLowerCase()) {
    const index = tempS.indexOf(c);
    indexArray.push(index);
    tempS = tempS.substring(index + 1, tempS.length);
  }
  return indexArray;
}

// using a simple regex search method for getting matching strings
// see notes for prefixSearch
function regexSearch(stampMap, substring) {
  let cacheTemp = [];
  let substringRegex = ".*";
  for (let c of substring) {
    substringRegex += c;
    substringRegex += ".*";
  }
  const regex = new RegExp(substringRegex,"gi")

  let queue = new PriorityQueue(comparator = (a, b) =>
    regexSubStringsIndex(substring,a).reduce((sum, x) => sum + x, 0) <
    regexSubStringsIndex(substring,b).reduce((sum, x) => sum + x, 0))

  // avoiding backwards queue behavior when substring is empty
  if (substring.length === 0) {

    for (let key of stampMap.keys()) {
      if (regex.test(key)) {
        cacheTemp.push(key);
      }
    }

  } else {

    for (let key of stampMap.keys()) {
      if (regex.test(key)) {
        queue.push(key);
      }
    }

    while (!queue.isEmpty()) {
      let val = queue.pop();
      cacheTemp.push(val);
    }

  }

  return new CycleArray(cacheTemp);
}

// k:v map of type string:string -> (stamp names:data), string
function prefixSearch(stampMap, substring) {
  let cacheTemp = [];
  for (let key of stampMap.keys()) {
    if (key.substring(0,substring.length).toLowerCase() === substring.toLowerCase()) {
      cacheTemp.push(key);
    }
  }
  return new CycleArray(cacheTemp);
}

/*
  * Etch Of Life Specific Methods
*/

keyDownCellSizeToggleEvent = (gameInstance) => {
  const handler = function(event) {
    const key = 'sizeToggleKey';
    if (gameInstance.searchToggle.get_val()) {
      return;
    }
    if (checkEventIdentifierUpper(event, key)) {
      gameInstance.stop();
      if (event.shiftKey) {
        gameInstance.cellSizeCycleArray.backward()
      }
      else {
        gameInstance.cellSizeCycleArray.forward()
      };
      const gameState = gameInstance.getState();
      gameInstance = new EtchOfLife(gameState);
      gameInstance.run();
      gameInstance.flashMenuText(event, key);
    }
  }
  return handler;
}

/*
  * Text Color Changes
*/

function delaySetColor(element, color = aliveCellColor) {
  setTimeout(() => { element.style.color = color; }, 200);
}

function flashColorText(element, color = textFlashColor) {
  element.style.color = color;
  delaySetColor(element);
}

function keyMenuColorSet(element, toggle_val) {
  if (toggle_val) {
    element.style.setProperty("color", textFlashColor);
  } else {
    element.style.setProperty("color", aliveCellColor);
  }
}

function setElementBackGroundColor(item, color) {
  item.style.setProperty("background-color", color);
}
