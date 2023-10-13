class EtchOfLife {

  constructor(state = new GameState()) {

    this.cellSizeCycleArray = state.cellSizeCycleArray;
    this.gameCellSize = this.cellSizeCycleArray.current();

    this.gameFPSCycleArray = state.gameFPSCycleArray;
    this.gameFPS = this.gameFPSCycleArray.current();

    this.gameToggleLoopMilliSecondDelay = 50;
    this.gameStamp = state.gameStamp;
    this.drawStampCache = [];
    this.stampSearchElementStore = [];
    this.mouseIndex = 0;

    this.grid = [];

    this.windowHeight = window.innerHeight;
    this.windowWidth = window.innerWidth;
    this.rows = parseInt((this.windowHeight) / this.gameCellSize) + 1;
    this.cols = parseInt((this.windowWidth) / this.gameCellSize) + 1;

    this.sketchToggle = state.sketchToggle;
    this.gameToggle = state.gameToggle;
    this.menuToggle = state.menuToggle;
    this.eraseDown = new Toggle(false);
    this.stampToggle = new Toggle(false);
    this.toggleKill = new Toggle(false);
    this.searchToggle = new Toggle(false);

    this.typeLine = new TypeLine();

    this.stampCache = state.stampCache;

    this.stampDataMap = global_gen_stampDataMap;
    this.stampCycleArray = new CycleArray([]);
    this.stampInfoMap = global_gen_stampInfoMap;
    this.stampKeyValidMap = this.genStampAcceptableCharMap(global_gen_stampDataMap);

    this.cellArray = [];
    this.cellArrayUpdate = [];

    this.listeners = [];

    this.keyDownEraseEvent = (event) => {
      const key = 'eraseToggleKey';
      if (this.searchToggle.get_val()) {
        return;
      }
      if (checkEventIdentifierUpper(event, key)) {
        this.eraseDown.toggle_val = true;
        if (this.gameStamp.localeCompare('none') != 0) {
          this.placeStamp(event.shiftKey);
        } else {
          this.cellArray[this.mouseIndex].die();
          this.cellArrayUpdate[this.mouseIndex].die();
          this.colorCell(this.grid[this.mouseIndex], this.mouseIndex);
        }
        document.querySelectorAll('.'+sessionStorage.getItem(key)).forEach((element) => {
          keyMenuColorSet(element, this.eraseDown.get_val());
        });
      }
    }
    this.keyUpEraseEvent = (event) => {
      const key = 'eraseToggleKey';
      if (checkEventIdentifierUpper(event, key)) {
        this.eraseDown.toggle_val = false;
        if (this.searchToggle.get_val()) {
          return;
        }
        document.querySelectorAll('.'+sessionStorage.getItem('eraseToggleKey')).forEach((element) => {
          keyMenuColorSet(element, this.eraseDown.get_val());
        });
      }
    }

    this.keyDownSketchToggleEvent = (event) => {
      const key = 'sketchToggleKey';
      if (this.searchToggle.get_val()) {
        return;
      }
      if (checkEventIdentifierUpper(event, key)) {
        this.sketchToggle.toggle();
        document.querySelectorAll('.'+sessionStorage.getItem(key)).forEach((element) => {
          keyMenuColorSet(element, this.sketchToggle.get_val());
        });
      }
    }

    this.keyDownGameToggleEvent = (event) => {
      const key = 'gameToggleKey';
      if (this.searchToggle.get_val()) {
        return;
      }
      if (checkEventIdentifierUpper(event, key)) {
        this.gameToggle.toggle();
        document.querySelectorAll('.'+sessionStorage.getItem(key)).forEach((element) => {
          keyMenuColorSet(element, this.gameToggle.get_val());
        });
      }
    }

    this.keyDownFPSToggleEvent = (event) => {
      const key = 'speedToggleKey';
      if (this.searchToggle.get_val()) {
        return;
      }
      if (checkEventIdentifierUpper(event, key)) {
        if (event.shiftKey) {
          this.gameFPS = this.gameFPSCycleArray.backward();
        } else {
          this.gameFPS = this.gameFPSCycleArray.forward();
        }
        this.flashMenuText(event, key);
        document.querySelectorAll('.'+sessionStorage.getItem(key)+'.cmd-display').forEach((element) => {
          element.textContent = this.gameFPS.toString() + 'fps';
        });
      }
    }

    this.keyDownStampCycleEvent = (event) => {
      const key = 'stampCycleKey';
      // if TAB key
      if (event.keyCode === 9) {
        event.preventDefault();
        if (this.searchToggle.get_val()) {
          if (event.shiftKey) {
            this.gameStamp = this.stampCycleArray.isEmpty() ? 'none': this.stampCycleArray.backward();
          } else {
            this.gameStamp = this.stampCycleArray.isEmpty() ? 'none': this.stampCycleArray.forward();
          }
          this.generateSearchStampText();
        } else {
          if (event.shiftKey) {
            this.gameStamp = this.stampCache.isEmpty() ? 'none': this.stampCache.backward();
          } else {
            this.gameStamp = this.stampCache.isEmpty() ? 'none': this.stampCache.forward();
          }
          this.stampsListUpdate();
        }
        this.updateStamp();
        this.flashMenuText(event, key);
        document.querySelectorAll('.stamp-description').forEach((element) => {
          element.textContent = this.stampInfoMap.get(this.gameStamp);
        });
      }
    }

    this.keyDownRotateStampEvent = (event) => {
      const key = 'rotateStampKey';
      if (this.searchToggle.get_val()) {
        return;
      }
      if (checkEventIdentifierUpper(event, key)) {
        if (event.shiftKey) {
          this.stampDataMap.set(this.gameStamp, flip2dMatrix(this.stampDataMap.get(this.gameStamp)));
        } else {
          this.stampDataMap.set(this.gameStamp, rotate2dMatrix90(this.stampDataMap.get(this.gameStamp)));
        }
        this.flashMenuText(event, key);
        this.updateStamp();
      }
    }

    this.keyDownStampAddEvent = (event) => {
      const key = 'stampAddKey';
      if (this.searchToggle.get_val() && event.key === 'Enter') {
        if (event.shiftKey) {
          this.stampCache.remove(this.gameStamp);
        } else {
          this.stampCache.insert(this.gameStamp);
        }
        this.gameStamp = this.stampCache.isEmpty() ? 'none': this.stampCache.current();
        this.stampsListUpdate();
        this.updateStamp();
        this.flashMenuText(event, key);
      }
      else if (!this.searchToggle.get_val() && event.key === 'Enter' && event.shiftKey) {
        this.stampCache.remove(this.gameStamp);
        this.gameStamp = this.stampCache.isEmpty() ? 'none': this.stampCache.current();
        this.stampsListUpdate();
        this.updateStamp();
        this.flashMenuText(event, key);
      }
    }

    this.keyDownSearchToggleEvent = (event) => {
      let key = 'searchToggleKey';
      if (!event.shiftKey && !this.searchToggle.get_val() && event.key === 'Enter' && this.menuToggle.get_val() ||
        this.searchToggle.get_val() && event.key === 'Escape'
        ) {
        this.searchToggle.toggle();
        if (this.searchToggle.get_val()) {
          // Enter pressed
          sessionStorage.setItem('searchToggleKey', 'esc');
          this.typeLine.clean();
        } else {
          // Esc pressed
          sessionStorage.setItem('searchToggleKey', 'enter');
          this.gameStamp = this.stampCache.isEmpty() ? 'none': this.stampCache.current();
          this.removeSearchStampText();
        }
        this.updateStamp();
        this.removeMenu();
        this.createMenu();
        document.querySelectorAll('.'+sessionStorage.getItem(key)).forEach((element) => {
          keyMenuColorSet(element, this.searchToggle.get_val());
        });
      }
    }

    this.keyDownSearchTypeEvent = (event) => {
      // console.log(event.key);
      // if we are in search mode
      if (this.searchToggle.get_val() && (this.stampKeyValidMap.get(event.key) === 1 || event.key === 'Backspace')) {
        const size = this.typeLine.size();
        if (event.key === 'Backspace') {
          if (event.ctrlKey) {
            this.typeLine.bigPop();
          } else {
            this.typeLine.pop();
          }
        } else {
          this.typeLine.push(event.key);
        }
        this.updateStampSearchCache();
        this.updateStamp();

        // make all new elements w/ proper coloring style
        this.generateSearchStampText();
        document.querySelectorAll('.stamp-description').forEach((element) => {
          element.textContent = this.stampInfoMap.get(this.gameStamp)
        });
        if (!(event.key === 'Backspace' && size === 0)) {
          this.typeLine.genLine();
        }
      } else if (this.searchToggle.get_val() && event.key === 'Enter') {
        this.updateStampSearchCache();
        this.updateStamp();
        this.generateSearchStampText();
        document.querySelectorAll('.stamp-description').forEach((element) => {
          element.textContent = this.stampInfoMap.get(this.gameStamp)
        });
        this.typeLine.genLine();
      }
    }

    this.keyDownMenuToggleEvent = (event) => {
      const key = 'menuToggleKey';
      if (this.searchToggle.get_val()) {
        return;
      }
      if (checkEventIdentifierUpper(event, key)) {
        this.menuToggle.toggle();
        this.flashMenuText(event, key);
        this.removeMenu();
        this.createMenu();
      }
    }

    this.keyDownClearToggleEvent = (event) => {
      const key = 'clearToggleKey';
      if (this.searchToggle.get_val()) {
        return;
      }
      if (checkEventIdentifierUpper(event, key)) {
        this.setLifeGrid(!event.shiftKey);
        this.colorGrid();
        this.flashMenuText(event, key);
      }
    }

    this.mouseDownEvent = (event) => {
      this.stampToggle.toggle_val = true;
      this.placeStamp(!event.shiftKey);
    }
    this.mouseUpEvent = (event) => {
      this.stampToggle.toggle_val = false;
    }

  }

  makeGrid() {
    const grid_container = document.getElementById("grid_container");

    const grid_wrapper = document.createElement('div');
    grid_container.appendChild(grid_wrapper).id = "grid_wrapper";
    grid_wrapper.style.setProperty('--grid-element-size', `${this.gameCellSize}px`);
    grid_wrapper.style.setProperty('--grid-rows', this.rows);
    grid_wrapper.style.setProperty('--grid-cols', this.cols);
    grid_wrapper.style.setProperty('display',`grid`);
    grid_wrapper.style.setProperty('max-height',`0px`);
    grid_wrapper.style.setProperty('max-width',`0px`);
    grid_wrapper.style.setProperty('grid-template-columns',`repeat(var(--grid-cols), 1fr)`);
    grid_wrapper.style.setProperty('grid-template-rows',`repeat(var(--grid-rows), 1fr)`);

    for (let i = 0; i < (this.rows * this.cols); i++) {
      let item = document.createElement("div");
      item.className = "grid-item";
      grid_wrapper.appendChild(item);
      this.cellArray.push(new Cell(false));
      this.cellArrayUpdate.push(new Cell(false));
    }

    this.grid = document.querySelectorAll('.grid-item');

    this.grid.forEach((element, index) => {
      // listen for mouse hover over grid items
      element.addEventListener('mouseover', (event) => {

        this.mouseIndex = index;

        // erase and sketch behavior
        if (this.eraseDown.get_val()) {
          if (this.gameStamp.localeCompare('none') != 0) {
            this.placeStamp(event.shiftKey);
          } else {
            this.cellArray[index].die();
            this.cellArrayUpdate[index].die();
            this.colorCell(element, index);
          }
        }
        else if (this.sketchToggle.get_val()) {
          if (this.gameStamp.localeCompare('none') != 0) {
            this.placeStamp(!event.shiftKey);
          } else {
            if (event.shiftKey) {
              this.cellArray[index].die();
              this.cellArrayUpdate[index].die();
            } else {
              this.cellArray[index].live();
              this.cellArrayUpdate[index].live();
            }
            this.colorCell(element, index);
          }
        }

        // handle stamp behavior
        this.setDrawStampCache(index);
        this.previewStamp();

        if (this.stampToggle.get_val()) {
          this.placeStamp(!event.shiftKey);
        }

      });

    });

  }

  removeSearchStampText() {
    const element = document.getElementById("search_text_wrapper");
    element.remove();
    this.stampSearchElementStore = [];
  }

  generateSearchStampText() {
    const parentElementEsc = document.getElementById("search_toggle");
    parentElementEsc.replaceChildren();

    const searchTextWrapperElement = document.createElement("div");
    searchTextWrapperElement.id = "search_text_wrapper";
    parentElementEsc.appendChild(searchTextWrapperElement);
    this.stampSearchElementStore = [];

    for (let c of this.gameStamp) {
      const char = document.createElement("text");
      char.classList.add("text");
      char.textContent = c;
      this.stampSearchElementStore.push(char);
    }

    let indexArray = regexSubStringsIndex(this.typeLine.getString(), this.gameStamp);

    // search not found
    if (indexArray.length > 0 && indexArray[0] === -1) {
      this.gameStamp = 'none';
      searchTextWrapperElement.textContent = this.gameStamp;
      return;
    }

    for (let i = 1; i < indexArray.length; i++) {
      indexArray[i] += indexArray[i-1] + 1;
    }

    if (indexArray.length > 0) {
      for (let index of indexArray) {
        this.stampSearchElementStore[index].style.color = textFlashColor;
      }
    }

    for (let i in this.stampSearchElementStore) {
      searchTextWrapperElement.appendChild(this.stampSearchElementStore[i]);
    }
  }

  // stores all valid chars from global_gen_stampDataMap key strings
  genStampAcceptableCharMap(map) {
    let result = new Map();
    for (let key of map.keys()) {
      for (let char of key) {
        result.set(char, 1);
      }
    }
    return result;
  }

  updateStampSearchCache() {
    let searchString = this.typeLine.getString();

    // this.stampCycleArray = prefixSearch(this.stampDataMap, searchString);
    this.stampCycleArray = regexSearch(this.stampDataMap, searchString);

    this.gameStamp = this.stampCycleArray.isEmpty() ? 'none': this.stampCycleArray.current();
  }

  updateStamp() {
    this.resetDrawStampCache();
    this.setDrawStampCache(this.mouseIndex);
    this.previewStamp();
  }

  setDrawStampCache(index) {
    const stamp = this.stampDataMap.get(this.gameStamp);

    if (stamp.length > 0) {
      const m = stamp[0].length;
      const n = stamp.length;

      this.resetDrawStampCache();

      for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
          const cellIndex = mod(index + j - parseInt(m / 2) + i * this.cols - parseInt(n / 2) * this.cols, this.rows * this.cols);
          if (stamp[i][j]) {
            this.drawStampCache.push(cellIndex);
          }
        }
      }

    }

  }

  previewStamp() {
    this.drawStampCache.forEach((element) => {
      this.cellArray[element].preview = true;
      this.colorCell(this.grid[element], element);
    })
  }

  placeStamp(life = true) {
    this.drawStampCache.forEach((element) => {
      if (life) {
        this.cellArray[element].live();
        this.cellArrayUpdate[element].live();
      }
      else {
        this.cellArray[element].die();
        this.cellArrayUpdate[element].die();
      }
      this.colorCell(this.grid[element], element);
    })
  }

  resetDrawStampCache() {
    this.drawStampCache.forEach((element) => {
      this.cellArray[element].preview = false;
      this.colorCell(this.grid[element], element);
    })
    this.drawStampCache = [];
  }

  stampsListUpdate() {
    if (!this.menuToggle.get_val()) {
      return;
    }

    const stamp_list_wrapper_element = document.getElementById("stamp_list_wrapper");

    const stamp_list_element = document.getElementById("stamp_list");
    if (stamp_list_element) {
      stamp_list_element.remove();
    }

    const stamp_list_row = document.createElement("div");
    stamp_list_row.classList.add("row");
    stamp_list_row.id = "stamp_list";
    stamp_list_wrapper_element.appendChild(stamp_list_row);
    this.stampCache.dataArray.forEach(element => {
      const list_element = document.createElement("p");
      if (element === this.gameStamp) {
        list_element.style.color = textFlashColor;
      }
      list_element.classList.add("list_element");
      list_element.textContent = element;
      stamp_list_row.appendChild(list_element);
    })
  }

  removeMenu() {
    const menuElement = document.getElementById("menu");
    if (menuElement) {
      menuElement.remove();
    }
  }

  generateMenuSection(menuElement, menu_map) {

    const row0 = document.createElement("div");
    row0.classList.add("row");
    menuElement.appendChild(row0);

    const col00 = document.createElement("div");
    col00.classList.add("col");
    row0.appendChild(col00);

    for(let i of menu_map) {
      const menu_key = sessionStorage.getItem(i[0]);
      const col_elem = document.createElement("p");
      if (menu_key == null) {
        col_elem.appendChild(document.createElement("br"));
      } else {
        col_elem.classList.add("cmd", menu_key);
        col_elem.textContent = menu_key;
      }
      col00.appendChild(col_elem);
    }

    const col01 = document.createElement("div");
    col01.classList.add("col");
    row0.appendChild(col01);

    for(let i of menu_map) {
      const menu_key = sessionStorage.getItem(i[0]);
      const col_elem = document.createElement("p");
      if (menu_key == null) {
        col_elem.appendChild(document.createElement("br"));
      } else {
        col_elem.classList.add("cmd-function", menu_key);
        col_elem.textContent = i[1];
      }
      col01.appendChild(col_elem);
    }

    const col02 = document.createElement("div");
    col02.classList.add("col");
    row0.appendChild(col02);

    for(let i of menu_map) {
      const menu_key = sessionStorage.getItem(i[0]);
      const col_elem = document.createElement("p");
      col_elem.classList.add("cmd-display", menu_key);
      col_elem.appendChild(document.createElement("br"));
      col02.appendChild(col_elem);
    }

  }

  createMenu() {

    const menuContainerElement = document.getElementById("menu_container");

    const menuElement = document.createElement("div");
    menuElement.id = "menu";
    menuContainerElement.appendChild(menuElement);

    if (!this.menuToggle.get_val()) {
      const hidden_menu_map = [
        ["menuToggleKey", "show menu"]
      ];
      menuElement.style.color = dullColor;
      this.generateMenuSection(menuElement, hidden_menu_map);
      return;
    }

    const menu_map = [
      ["sketchToggleKey","toggle sketching"],
      ["gameToggleKey", "toggle game"],
      ["speedToggleKey", "game speed"],
      ["sizeToggleKey", "cell size"],
      ["eraseToggleKey", "erase"],
      ["clearToggleKey", "clear screen"],
      ["menuToggleKey", "show menu"],
      ["", ""]
    ];

    this.generateMenuSection(menuElement, menu_map);

    // stamp list in its own row
    //
    // stamps list ==>
    const row2 = document.createElement("div");
    row2.classList.add("row");
    menuElement.appendChild(row2);

    const col20 = document.createElement("div");
    col20.classList.add("col");
    row2.appendChild(col20);

    const col_stamps_title = document.createElement("p");
    col_stamps_title.classList.add("cmd");
    col_stamps_title.id = "stamps_title";
    col_stamps_title.textContent = "stamps";
    col20.appendChild(col_stamps_title);

    const col21 = document.createElement("div");
    col21.classList.add("col");
    row2.appendChild(col21);

    // this.stampCache.forEach((element) => )
    const col_stamp_list_wrapper = document.createElement("p");
    col_stamp_list_wrapper.classList.add("cmd-display");
    col_stamp_list_wrapper.id = "stamp_list_wrapper";
    col21.appendChild(col_stamp_list_wrapper);
    this.stampsListUpdate();

    // rest of stamp menu
    let menu_map_stamp_section = [
      ["rotateStampKey", "rotate stamp"],
      ["searchToggleKey", "search stamps"],
      ["stampCycleKey", "cycle stamp"]
    ]

    if (this.searchToggle.get_val()) {
      menu_map_stamp_section.push(["stampAddKey", "save stamp"]);
    }

    this.generateMenuSection(menuElement, menu_map_stamp_section);

    // stamp description in its own row
    //
    const row3 = document.createElement("div");
    row3.classList.add("row");
    menuElement.appendChild(row3);

    const col30 = document.createElement("div");
    col30.classList.add("col");
    row3.appendChild(col30);

    const col_elem = document.createElement("p");
    col_elem.classList.add("stamp-description");
    col_elem.appendChild(document.createElement("br"));
    col30.appendChild(col_elem);

    document.querySelectorAll('.stamp-description').forEach((element) => {
      element.textContent = this.stampInfoMap.get(this.gameStamp);
    });
    document.querySelectorAll('.'+sessionStorage.getItem('speedToggleKey')+'.cmd-display').forEach((element) => {
      element.textContent = this.gameFPS.toString() + 'fps';
    });
    document.querySelectorAll('.'+sessionStorage.getItem('sizeToggleKey')+'.cmd-display').forEach((element) => {
      element.textContent = this.gameCellSize.toString() + 'pixels';
    });
    document.querySelectorAll('.'+sessionStorage.getItem('sketchToggleKey')).forEach((element) => {
      if (!this.searchToggle.get_val()) {
        keyMenuColorSet(element, this.sketchToggle.get_val());
      }
    });
    document.querySelectorAll('.'+sessionStorage.getItem('gameToggleKey')).forEach((element) => {
      if (!this.searchToggle.get_val()) {
        keyMenuColorSet(element, this.gameToggle.get_val());
      }
    });
    document.querySelectorAll('.'+sessionStorage.getItem('stampCycleKey')+'.cmd-display').forEach((element) => {
      // tag with unique id for writing to later
      element.id = "search_toggle";
    });
    if (this.searchToggle.get_val()) {
      document.querySelectorAll('.'+sessionStorage.getItem('searchToggleKey')+'.cmd-display').forEach((element) => {
        // tag with unique id for writing to later
        element.id = "search_type";
      });
    }

    // color for when in stamp search mode
    const menu_search_active_list = [
      ["stampCycleKey"], ["stampAddKey"]
    ];

    menu_search_active_list.forEach(element => {
      document.querySelectorAll('.'+sessionStorage.getItem(element)).forEach((e) => {
        e.classList.add('search-active');
      });
    })

    if (this.searchToggle.get_val()) {
      menuElement.style.color = dullColor;
      document.querySelectorAll('.search-active').forEach((element) => {
        element.style.color = aliveCellColor;
      });
    } else {
      menuElement.style.color = aliveCellColor;
    }

  }

  docListeners() {

    this.listeners.push(['keydown',   this.keyDownEraseEvent]);
    this.listeners.push(['keyup',     this.keyUpEraseEvent]);
    this.listeners.push(['keydown',   this.keyDownSketchToggleEvent]);
    this.listeners.push(['keydown',   this.keyDownGameToggleEvent]);
    this.listeners.push(['keydown',   this.keyDownFPSToggleEvent]);
    this.listeners.push(['keydown',   this.keyDownStampCycleEvent]);
    this.listeners.push(['keydown',   this.keyDownRotateStampEvent]);
    this.listeners.push(['keydown',   this.keyDownClearToggleEvent]);
    this.listeners.push(['keydown',   this.keyDownStampAddEvent]);
    this.listeners.push(['keydown',   this.keyDownSearchToggleEvent]);
    this.listeners.push(['keydown',   this.keyDownSearchTypeEvent]);
    this.listeners.push(['keydown',   this.keyDownMenuToggleEvent]);
    this.listeners.push(['mousedown', this.mouseDownEvent]);
    this.listeners.push(['mouseup',   this.mouseUpEvent]);

    for(let listener of this.listeners) {
      document.addEventListener(listener[0], listener[1]);
    }

  }

  checkNeighbors(cellIndex) {
    let aliveNeighbors = 0;
    // iterate through neighbors and sum the living
    const indices = [];
    indices.push(cellIndex - this.cols);
    indices.push(cellIndex - this.cols - 1);
    indices.push(cellIndex - this.cols + 1);
    indices.push(cellIndex + this.cols);
    indices.push(cellIndex + this.cols - 1);
    indices.push(cellIndex + this.cols + 1);
    indices.push(cellIndex - 1);
    indices.push(cellIndex + 1);

    indices.forEach((element) => {
      aliveNeighbors += (this.cellArray[mod(element, this.rows * this.cols)].getState());
    })

    return aliveNeighbors;
  }

  setLifeGrid(whiteout = true) {
    this.cellArray.forEach((element, index) => {
      if (whiteout) {
        element.die();
        this.cellArrayUpdate[index].die();
      } else {
        element.live();
        this.cellArrayUpdate[index].live();
      }
    });
  }

  colorGrid() {
    this.grid.forEach((element, index) => {
      this.colorCell(element, index);
    });
  }

  colorCell(cell, index) {
    if (this.cellArray[index].preview === true) {
      setElementBackGroundColor(cell, dullColor);
    }
    else if (this.cellArray[index].getState()) {
      setElementBackGroundColor(cell, aliveCellColor);
    } else {
      setElementBackGroundColor(cell, deadCellColor);
    }
  }

  flashMenuText(event, key) {
    document.querySelectorAll('.'+sessionStorage.getItem(key)).forEach((element) => {
      flashColorText(element, (() => {if(event.shiftKey) {return textFlashColorR} else {return textFlashColor}})());
    });
  }

  async gameOfLife () {
    while (true) {

      while (this.gameToggle.get_val() != true) {
        await timer(this.gameToggleLoopMilliSecondDelay);
      }

      await timer(1. / this.gameFPS * 1000);

      this.cellArray.forEach((cell, index) => {
        let aliveNeighbors = this.checkNeighbors(index);
        if (cell.getState()) {
          if (aliveNeighbors == 2 || aliveNeighbors == 3){
            this.cellArrayUpdate[index].live();
          } else {
            this.cellArrayUpdate[index].die();
          }
        } else {
          if (aliveNeighbors == 3) {
            this.cellArrayUpdate[index].live();
          }
        }
      });
      this.cellArray.forEach((cell, index) => {
        if (this.cellArrayUpdate[index].getState()) {
          cell.live();
        } else {
          cell.die();
        }
      });
      if (this.toggleKill.get_val()) {
        return;
      }
      this.colorGrid();
    }
  }

  async run() {
    this.makeGrid();
    this.colorGrid();
    this.createMenu();
    this.docListeners();
    this.gameOfLife();
  }

  getState() {
    return new GameState(
      this.sketchToggle,
      this.gameToggle,
      this.menuToggle,
      this.gameStamp,
      this.cellSizeCycleArray,
      this.gameFPSCycleArray,
      this.stampCache);
  }

  stop() {

    this.toggleKill.toggle();

    while (this.listeners.length > 0) {
      const listener = this.listeners.pop();
      document.removeEventListener(listener[0], listener[1]);
    }

    const grid_wrapper = document.getElementById("grid_wrapper");
    grid_wrapper.remove();

    this.removeMenu();

  }

}
