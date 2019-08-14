// Copyright (c) 2015 Jefferson Lee
// Copyright (c) 2018 Ritwik Abhishek
// Copyright (c) 2018,19 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

function MusicKeyboard() {
    var synth = new Tone.PolySynth(10).toMaster();

    const BUTTONDIVWIDTH = 535;  // 5 buttons
    const DRUMNAMEWIDTH = 50;
    const OUTERWINDOWWIDTH = 758;
    const INNERWINDOWWIDTH = 50;
    const BUTTONSIZE = 53;
    const ICONSIZE = 32;
    const BLACKKEYS = [87,69,82,84,89,85,73,79];
    const WHITEKEYS = [65,83,68,70,71,72,74,75,76];

    var w = window.innerWidth;
    this._cellScale = w / 1200;

    this._stopOrCloseClicked = false;
    this.playingNow = false;

    this.noteNames = [];
    this.octaves = [];
    this.keyboardShown = true;
    this.layout = [];
    this.idContainer = [];

    var keyboard = document.getElementById('keyboard');
    var keyboardHolder = document.getElementById('keyboardHolder2');
    var firstOctave = document.getElementById('firstOctave');
    var firstNote = document.getElementById('firstNote');
    var secondOctave = document.getElementById('secondOctave');
    var secondNote = document.getElementById('secondNote');
    var whiteKeys = document.getElementById('white');
    var blackKeys = document.getElementById('black');

    var whiteNoteEnums = ['C','D','E','F','G','A','B'];
    var blackNoteEnums = ['C' + SHARP + '/D' + FLAT, 'D' + SHARP + '/E' + FLAT, null, 'F' + SHARP + '/G' + FLAT, 'G' + SHARP + '/A' + FLAT, 'A' + SHARP + '/B' + FLAT, null];

    var selected = [];
    var selected1 = [];

    this._rowBlocks = [];
    this._selectedHelper = [];

    this.addRowBlock = function(rowBlock) {
        this._rowBlocks.push(rowBlock);
    };

    this.processSelected = function() {
        if (this._selectedHelper.length === 0) {
            selected1 = [];
            return;
        }

        this._selectedHelper.sort(function(a, b) {
            return a[0]-b[0];
        })

        for (var i = 1; i < this._selectedHelper.length; i++) {
            if(this._selectedHelper[i][0] - this._selectedHelper[i-1][0] < 125) {
                this._selectedHelper[i][0] = this._selectedHelper[i-1][0];
            }
        }
        selected1 = [[[this._selectedHelper[0][1]], [this._selectedHelper[0][2]], [this._selectedHelper[0][3]], this._selectedHelper[0][0]]];
        var j = 0
        for (var i = 1; i < this._selectedHelper.length; i++) {
            while (i < this._selectedHelper.length && (this._selectedHelper[i][0] === this._selectedHelper[i-1][0])) {
                selected1[j][0].push(this._selectedHelper[i][1])
                selected1[j][1].push(this._selectedHelper[i][2])
                selected1[j][2].push(this._selectedHelper[i][3])
                i++;
            }

            j++;
            if(i < this._selectedHelper.length){
                selected1.push([[this._selectedHelper[i][1]], [this._selectedHelper[i][2]], [this._selectedHelper[i][3]], this._selectedHelper[i][0]])
            }
        }
    }

    this.addKeyboardShortcuts = function() {
        var that = this;
        var duration = 0;
        var start = {};
        var temp1 = {};
        var temp2 = {};
        var prevKey = 0;
        var __keyboarddown = function(event) {
            if (WHITEKEYS.indexOf(event.keyCode) !== -1) {
                var i = WHITEKEYS.indexOf(event.keyCode);
                var id = 'whiteRow' + i.toString();
                var ele = docById(id);
                if ((id in start) == false) {
                    start[id] = new Date();
                }
            } else if (BLACKKEYS.indexOf(event.keyCode) !== -1) {
                var i = BLACKKEYS.indexOf(event.keyCode);
                var id = 'blackRow'+i.toString();
                var ele = docById(id);
                if ((id in start) == false) {
                    start[id] = new Date();
                }
            }

            if (ele !== null && ele !== undefined) {
                temp1[id] = ele.getAttribute('alt').split('__')[0];
                if (temp1[id] === 'hertz') {
                    temp2[id] = parseInt(ele.getAttribute('alt').split('__')[1]);
                } else if (temp1[id] in FIXEDSOLFEGE1) {
                    temp2[id] = FIXEDSOLFEGE1[temp1[id]].replace(SHARP, '#').replace(FLAT, 'b') + ele.getAttribute('alt').split('__')[1];
                } else {
                    temp2[id] = temp1[id].replace(SHARP, '#').replace(FLAT, 'b') + ele.getAttribute('alt').split('__')[1];
                }

                synth.triggerAttack(temp2[id]);
                prevKey = event.keyCode;
            }
        }

        var __keyboardup = function(event) {
            if (WHITEKEYS.indexOf(event.keyCode) !== -1) {
                var i = WHITEKEYS.indexOf(event.keyCode);
                var id = 'whiteRow'+i.toString();
                var ele = docById(id);
                duration = (new Date() - start[id]) / 1000.0;
            } else if (BLACKKEYS.indexOf(event.keyCode) !== -1) {
                var i = BLACKKEYS.indexOf(event.keyCode);
                var id = 'blackRow'+i.toString();
                var ele = docById(id);
                duration = (new Date() - start[id]) / 1000.0;
            }

            if (ele !== null && ele !== undefined) {
                var no = ele.getAttribute('alt').split('__')[2];
                duration = parseFloat((Math.round(duration * 8) / 8).toFixed(3));
                if (duration === 0) {
                    duration = 0.125;
                }
                if ( synth instanceof Tone.PolySynth ) {
                    synth.triggerRelease( temp2[id] );
                } else if ( temp2[id] && event.keyCode === prevKey ) {;
                    synth.triggerRelease();
                }
                that._selectedHelper.push([start[id].getTime(), temp2[id], parseInt(no), duration]);
                delete start[id];
                delete temp1[id];
                delete temp2[id];
            }
        }

        document.onkeydown = __keyboarddown;
        document.onkeyup = __keyboardup;
    }

    this.loadHandler = function(element, i, no) {
        var temp1 = this.layout[i][0];
        if (temp1 === 'hertz') {
            var temp2 = this.layout[i][1];
        } else if (temp1 in FIXEDSOLFEGE1) {
            var temp2 = FIXEDSOLFEGE1[temp1].replace(SHARP, '#').replace(FLAT, 'b') + this.layout[i][1];
        } else {
            var temp2 = temp1.replace(SHARP, '#').replace(FLAT, 'b') + this.layout[i][1];
        }

        var that = this;
        var duration = 0;
        var start = 0;

        element.onmousedown = function() {
            start = new Date();
            synth.triggerAttack(temp2);
        }

        element.onmouseup = function() {
            duration = (new Date() - start)/1000.0;
            synth.triggerRelease(temp2)
            duration = parseFloat((Math.round(duration * 8) / 8).toFixed(3));
            if (duration === 0) {
                duration = 0.125;
            }
            that._selectedHelper.push([start.getTime(), temp2,no, duration]);
        }
    };

    this.init = function(logo) {
        this._logo = logo; 

        this.playingNow = false;
        var w = window.innerWidth;
        this._cellScale = w / 1200;
        var iconSize = ICONSIZE * this._cellScale;

        var canvas = docById('myCanvas');

        // Position the widget and make it visible.
        var mkbDiv = docById('mkbDiv');
        mkbDiv.style.visibility = 'visible';
        mkbDiv.setAttribute('draggable', 'true');
        mkbDiv.style.left = '200px';
        mkbDiv.style.top = '150px';

        // The buttons
        var mkbButtonsDiv = docById('mkbButtonsDiv');
        mkbButtonsDiv.style.display = 'inline';
        mkbButtonsDiv.style.visibility = 'visible';
        mkbButtonsDiv.style.width = BUTTONDIVWIDTH;
        mkbButtonsDiv.innerHTML = '<table cellpadding="0px" id="mkbButtonTable"></table>';

        var buttonTable1 = docById('mkbButtonTable');
        var header1 = buttonTable1.createTHead();
        var row1 = header1.insertRow(0);
        this._keysLayout();

        var that = this;

        var cell = this._addButton(row1,'close-button.svg', ICONSIZE, _('close'));

        cell.onclick = function() {
            document.onkeydown = __keyPressed;
            var mkbTableDiv = docById('mkbTableDiv');
            mkbTableDiv.innerHTML = '';
            mkbDiv.style.visibility = 'hidden';
            mkbButtonsDiv.style.visibility = 'hidden';

            if (document.getElementById('keyboardHolder2')) {
                document.getElementById('keyboardHolder2').style.display = 'none';
            }

            var myNode = document.getElementById('myrow');
            myNode.innerHTML = '';
            var myNode = document.getElementById('myrow2');
            myNode.innerHTML = '';
            selected = [];
            selected1 = [];
        };


        var cell = this._addButton(row1, 'play-button.svg', ICONSIZE, _('Play'));

        cell.onclick = function() {
            that._logo.setTurtleDelay(0);
            that.processSelected();
            that.playAll(row1)
        };

        var cell = this._addButton(row1, 'export-chunk.svg', ICONSIZE, _('Save'));

        cell.onclick = function() {
            that._save();
        };

        var cell = this._addButton(row1, 'erase-button.svg', ICONSIZE, _('Clear'));

        cell.onclick=function() {
            that._selectedHelper =[];
            selected1 = [];
        };

        var cell = this._addButton(row1, 'add2.svg', ICONSIZE, _('Add note'));
        cell.setAttribute('id', 'addnotes');
        cell.onclick = function () {
            that._createAddRowPieSubmenu();
        };

        var cell = this._addButton(row1, 'table.svg', ICONSIZE, _('Table'));
        
        that._createKeyboard();

        this.toggleNotesButton = function () {
            if (that.keyboardShown) {
                cell.getElementsByTagName("img")[0].src = 'header-icons/keyboard.svg';
                cell.getElementsByTagName("img")[0].title = 'keyboard';
                cell.getElementsByTagName("img")[0].alt = 'keyboard';
            } else {
                cell.getElementsByTagName("img")[0].src = 'header-icons/table.svg';
                cell.getElementsByTagName("img")[0].title = 'table';
                cell.getElementsByTagName("img")[0].alt = 'table';

            }
        }

        cell.onclick = function() {
            if (that.keyboardShown) {
                that._createTable();
            } else {
                that._createKeyboard();
            }
            that.toggleNotesButton();
            that.keyboardShown = !that.keyboardShown;
        }

        var dragCell = this._addButton(row1, 'grab.svg', ICONSIZE, _('Drag'));
        dragCell.style.cursor = 'move';

        this._dx = dragCell.getBoundingClientRect().left - mkbDiv.getBoundingClientRect().left;
        this._dy = dragCell.getBoundingClientRect().top - mkbDiv.getBoundingClientRect().top;
        this._dragging = false;
        this._target = false;
        this._dragCellHTML = dragCell.innerHTML;

        dragCell.onmouseover = function(e) {
            // In order to prevent the dragged item from triggering a
            // browser reload in Firefox, we empty the cell contents
            // before dragging.
            dragCell.innerHTML = '';
        };

        dragCell.onmouseout = function(e) {
            if (!that._dragging) {
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        canvas.ondragover = function(e) {
            that._dragging = true;
            e.preventDefault();
        };

        canvas.ondrop = function(e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - that._dx;
                mkbDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
                mkbDiv.style.top = y + 'px';
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        mkbDiv.ondragover = function(e) {
            that._dragging = true;
            e.preventDefault();
        };

        mkbDiv.ondrop = function(e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - that._dx;
                mkbDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
                mkbDiv.style.top = y + 'px';
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        mkbDiv.onmousedown = function(e) {
            that._target = e.target;
        };

        mkbDiv.ondragstart = function(e) {
            if (dragCell.contains(that._target)) {
                e.dataTransfer.setData('text/plain', '');
            } else {
                e.preventDefault();
            }
        };
    };

    this.playAll = function(row) {
        if (selected1.length <= 0) {
            return;
        }

        this.playingNow = !this.playingNow;
        var playButtonCell = row.cells[1];

        if (this.playingNow) {
            playButtonCell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/' + 'stop-button.svg' + '" title="' + _('stop') + '" alt="' + _('stop') + '" height="' + ICONSIZE + '" width="' + ICONSIZE + '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';

            if (selected1.length < 1) {
                return;
            }

            var notes = [];
            for (var i = 0; i < selected1[0][0].length; i++) {
                if (this.keyboardShown) {
                    var id = this.idContainer.findIndex(function(ele) {
                        return ele[1] === selected1[0][1][i]
                    });

                    var ele = docById(this.idContainer[id][0]);
                    ele.style.backgroundColor = 'lightgrey';
                }
                
                var zx = selected1[0][0][i];     
                var res = zx;       
                if( typeof(zx) === 'string') {
                    res = zx.replace(SHARP, '#').replace(FLAT, 'b');
                }

                notes.push(res)
            }

            if (!this.keyboardShown) {
                var cell = docById('cells-0');
                cell.style.backgroundColor = platformColor.selectorBackground
            }

            this._stopOrCloseClicked = false;
            this._playChord(notes, selected1[0][2]);
            var maxWidth = Math.max.apply(Math, selected1[0][2]);
            this.playOne(1, maxWidth, playButtonCell)
        } else {
            if (!this.keyboardShown) {
                this._createTable();
            } else {
                this._createKeyboard();
            }

            this._stopOrCloseClicked = true;
            playButtonCell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/' + 'play-button.svg' + '" title="' + _('Play') + '" alt="' + _('Play') + '" height="' + ICONSIZE + '" width="' + ICONSIZE + '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
        }
    }

    this.playOne = function(counter, time, playButtonCell) {
        var that = this;
        setTimeout(function () {
            if (counter < selected1.length) {
                if (that._stopOrCloseClicked) {
                    return;
                }

                if (!that.keyboardShown) {
                    var cell = docById('cells-' + counter);
                    cell.style.backgroundColor = platformColor.selectorBackground
                }

                if (that.keyboardShown) {
                    for (var i = 0; i < selected1[counter-1][0].length; i++) {
                            var id = that.idContainer.findIndex(function(ele) {
                                return ele[1] === selected1[counter-1][1][i];
                            });
                            var ele = docById(that.idContainer[id][0]);
                            ele.style.backgroundColor = 'white';
                    }
                }

                var notes = [];
                for (var i = 0; i < selected1[counter][0].length; i++) {
                    if (that.keyboardShown) {
                        var id = that.idContainer.findIndex(function(ele) {
                            return ele[1] === selected1[counter][1][i];
                        });

                        var ele = docById(that.idContainer[id][0]);
                        ele.style.backgroundColor = 'lightgrey';
                    }

                    var zx = selected1[counter][0][i];
                    var res = zx;
                    if(typeof(zx)==='string'){
                        res = zx.replace(SHARP, '#').replace(FLAT, 'b');
                    }
                    notes.push(res)
                }

                if (that.playingNow) {
                    that._playChord(notes,selected1[counter][2]);
                }

                var maxWidth = Math.max.apply(Math, selected1[counter][2]);
                that.playOne(counter+1, maxWidth, playButtonCell)
            } else {
                playButtonCell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/' + 'play-button.svg' + '" title="' + _('Play') + '" alt="' + _('Play') + '" height="' + ICONSIZE + '" width="' + ICONSIZE + '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
                that.playingNow = false;
                if (!that.keyboardShown) {
                    that._createTable();
                } else {
                    that._createKeyboard();
                }
            }
        }, time * 1000 + 125);
    }

    this._playChord = function (notes, noteValue) {
        var that = this;
        setTimeout(function () {
            synth.triggerAttackRelease(notes[0], noteValue[0]);
        }, 1);

        if (notes.length > 1) {
            setTimeout(function () {
                synth.triggerAttackRelease(notes[1], noteValue[1]);
            }, 1);
        }

        if (notes.length > 2) {
            setTimeout(function () {
                synth.triggerAttackRelease(notes[2], noteValue[2]);
            }, 1);
        }

        if (notes.length > 3) {
            setTimeout(function () {
                synth.triggerAttackRelease(notes[3], noteValue[3]);
            }, 1);
        }
    };

    this._keysLayout = function() {
        this.layout = [];
        var sortableList = [];
        for (var i = 0; i < this.noteNames.length; i++){
            if (this.noteNames[i] === 'hertz') {
                sortableList.push([this.octaves[i], this.noteNames[i], this.octaves[i], this._rowBlocks[i]]);
            } else {
                sortableList.push([noteToFrequency(this.noteNames[i]+ this.octaves[i], this._logo.keySignature[0]), this.noteNames[i], this.octaves[i], this._rowBlocks[i]]);
            }
        }

        var sortedList = sortableList.sort(
            function(a, b) {
                return a[0] - b[0]
            }
        )

        var unique = [];
        this.remove = [];
        var that = this;
        sortedList = sortedList.filter(
            function (item){
                if(unique.indexOf(item[1] + item[2]) === -1){
                    unique.push(item[1]+item[2])
                    return true;
                }
                that.remove.push(item[3])
                return false;
            }
        )

        function removeBlock(i) {
            setTimeout(function() { 
                that._removePitchBlock(that.remove[i]); 
            }, 200);
        }

        for (var i = 0; i < this.remove.length; i++){
            removeBlock(i);
        }

        for (var i = 0; i < sortedList.length; i++) {
            this.layout.push([sortedList[i][1], sortedList[i][2], sortedList[i][3]]);
        }
    }

    this._setNotes = function(colIndex, rowIndex, playNote) {
        var d = docById('cells-' + colIndex).getAttribute('start');
        this._selectedHelper = this._selectedHelper.filter(function(ele) {
            return ele[0]!=parseInt(d)
        });

        for (var j = 0; j < this.layout.length; j++) {
            var row = docById('mkb' + j);
            var cell = row.cells[colIndex];
            if (cell.style.backgroundColor === 'black') {
                this._setNoteCell(j, colIndex, d, playNote);
            }
        }
    }

    this._setNoteCell = function(j, colIndex, start, playNote) {
        var n = this.layout.length
        var temp1 = this.layout[n-j-1][0];
        if (temp1 === 'hertz') {
            var temp2 = this.layout[n-j-1][1];
        } else if (temp1 in FIXEDSOLFEGE1) {
            var temp2 = FIXEDSOLFEGE1[temp1].replace(SHARP, '#').replace(FLAT, 'b') + this.layout[n-j-1][1];
        } else {
            var temp2 = temp1.replace(SHARP, '#').replace(FLAT, 'b') + this.layout[n-j-1][1];
        }

        var ele = docById(j + ':' + colIndex);
        this._selectedHelper.push([parseInt(start), temp2, this.layout[n-j-1][2], ele.getAttribute('alt')]);
        if (playNote) {
            synth.triggerAttackRelease(temp2, ele.getAttribute('alt'));
        }
    }

    this.makeClickable = function() {
        for (var i = 0; i < this.layout.length; i++) {
            // The buttons get added to the embedded table.
            var row = docById('mkb' + i);
            for (var j = 0; j < row.cells.length; j++) {
                var cell = row.cells[j];
                // Give each clickable cell a unique id
                cell.setAttribute('id', i + ':' + j);

                var that = this;
                var isMouseDown = false;

                cell.onmousedown = function () {
                    isMouseDown = true;
                    var obj = this.id.split(':');
                    var i = Number(obj[0]);
                    var j = Number(obj[1]);
                    if (this.style.backgroundColor === 'black') {
                        this.style.backgroundColor = this.getAttribute('cellColor');
                        that._setNotes(j, i, false);
                    } else {
                        this.style.backgroundColor = 'black';
                        that._setNotes(j, i, true);
                    }
                }

                cell.onmouseover = function () {
                    var obj = this.id.split(':');
                    var i = Number(obj[0]);
                    var j = Number(obj[1]);
                    if (isMouseDown) {
                        if (this.style.backgroundColor === 'black') {
                            this.style.backgroundColor = this.getAttribute('cellColor');
                            that._setNotes(j, i, false);
                        } else {
                            this.style.backgroundColor = 'black';
                            that._setNotes(j, i, true);
                        }
                    }
                }

                cell.onmouseup = function () {
                     isMouseDown = false;
                }
            }
        }
    }

    this._noteWidth = function (noteValue) {
        return Math.max(Math.floor(EIGHTHNOTEWIDTH * (8 * noteValue) * this._cellScale), 15);
    };

    this._createTable = function() {
        this.processSelected();
        var mkbTableDiv = docById('mkbTableDiv');
        mkbTableDiv.style.display = 'inline';
        mkbTableDiv.style.visibility = 'visible';
        mkbTableDiv.style.border = '0px';
        mkbTableDiv.style.width = '300px';
        mkbTableDiv.innerHTML = '';
        
        mkbTableDiv.innerHTML = '<div id="mkbOuterDiv"><div id="mkbInnerDiv"><table cellpadding="0px" id="mkbTable"></table></div></div>';

        var n = Math.max(Math.floor((window.innerHeight * 0.5) / 100), 8);

        var outerDiv = docById('mkbOuterDiv');
        if (this.layout.length > n) {
            outerDiv.style.height = this._cellScale * MATRIXSOLFEHEIGHT * (n + 5) + 'px';
            var w = Math.max(Math.min(window.innerWidth, this._cellScale * OUTERWINDOWWIDTH), BUTTONDIVWIDTH);
            outerDiv.style.width = w + 'px';
        } else {
            outerDiv.style.height = this._cellScale * MATRIXSOLFEHEIGHT * (this.layout.length + 4) + 'px';
            var w = Math.max(Math.min(window.innerWidth, this._cellScale * OUTERWINDOWWIDTH - 20), BUTTONDIVWIDTH);
            outerDiv.style.width = w + 'px';
        }
        outerDiv.style.backgroundColor = 'white';
        outerDiv.style.marginTop = '15px';

        var w = Math.max(Math.min(window.innerWidth, this._cellScale * INNERWINDOWWIDTH), BUTTONDIVWIDTH - BUTTONSIZE);
        var innerDiv = docById('mkbInnerDiv');
        innerDiv.style.width = w + 'px';
        innerDiv.style.marginLeft = Math.floor(MATRIXSOLFEWIDTH * this._cellScale)*1.5 + 'px';

        var mkbTable = docById('mkbTable');
        if (selected1.length < 1) {
            outerDiv.innerHTML = 'No note selected';
            return;
        }
        var that = this;
        j=0;
        var n = this.layout.length;
        for (var i = this.layout.length - 1; i >= 0; i--) {
            var mkbTableRow = mkbTable.insertRow(); 
            var cell = mkbTableRow.insertCell(); 
            cell.style.backgroundColor = platformColor.graphicsLabelBackground;
            cell.style.fontSize = this._cellScale * 100 + '%';
            cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 1 + 'px';
            cell.style.width = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) * 1.5 + 'px';
            cell.style.minWidth = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) * 1.5 + 'px';
            cell.style.maxWidth = cell.style.minWidth;
            cell.className = 'headcol';  // This cell is fixed horizontally.
	    if (this.layout[i][0] === 'hertz') {
                cell.innerHTML = this.layout[i][1].toString() + 'HZ';
            } else {
                cell.innerHTML = _(this.layout[i][0]) + '<sub>' + this.layout[i][1].toString() + '</sub>';
            }
            cell.setAttribute('id', 'labelcol' + (n - i - 1));
            if (this.layout[i][0] === 'hertz'){
                cell.setAttribute('alt', (n - i - 1) + '__' + 'synthsblocks');
            } else {
                cell.setAttribute('alt', (n - i - 1) + '__' + 'pitchblocks')
            }

            cell.onclick = function(event) {
                cell = event.target;
                if (cell.getAttribute('alt') === null) {
                    cell = cell.parentNode;
                }

                var index = cell.getAttribute('alt').split('__')[0]
                var condition = cell.getAttribute('alt').split('__')[1]
                that._createColumnPieSubmenu(index, condition);
            }
            var mkbCell = mkbTableRow.insertCell();
            // Create tables to store individual notes.
            mkbCell.innerHTML = '<table cellpadding="0px" id="mkbCellTable' + j + '"></table>';
            var mkbCellTable = docById('mkbCellTable' + j);
            mkbCellTable.style.marginTop = '-1px';

            // We'll use this element to put the clickable notes for this row.
            var mkbRow = mkbCellTable.insertRow();
            mkbRow.setAttribute('id', 'mkb' + j);
            j += 1;         
        }
        var mkbTableRow = mkbTable.insertRow(); 
        var cell = mkbTableRow.insertCell(); 
        cell.style.backgroundColor = platformColor.graphicsLabelBackground;
        cell.style.fontSize = this._cellScale * 100 + '%';
        cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 1 + 'px';
        cell.style.width = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) * 1.5 + 'px';
        cell.style.minWidth = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) * 1.5 + 'px';
        cell.style.maxWidth = cell.style.minWidth;
        cell.className = 'headcol';  // This cell is fixed horizontally.
        cell.innerHTML = 'duration';

        var ptmCell = mkbTableRow.insertCell();
        ptmCell.innerHTML = '<table  class="mkbTable" cellpadding="0px"><tr id="mkbNoteDurationRow"></tr></table>';
        var mkbCellTable = docById('mkbTable');
        var cellColor = 'rgb(124, 214, 34)';

        for (var j = 0; j < selected1.length; j++) {
            var maxWidth = Math.max.apply(Math, selected1[j][2]);
            var noteMaxWidth = this._noteWidth(Math.max.apply(Math, selected1[j][2])) + 'px';
            var n = this.layout.length;
            for (var i = 0; i < this.layout.length; i++) {
                var row = docById('mkb' + i);
                var cell = row.insertCell();
                cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 1 + 'px';
                cell.style.width = noteMaxWidth;
                cell.style.minWidth = cell.style.width;
                cell.style.maxWidth = cell.style.width;
                
                if (selected1[j][1].indexOf(this.layout[n-i-1][2]) !== -1) {
                    var ind = selected1[j][1].indexOf(this.layout[n-i-1][2]);
                    cell.setAttribute('alt', selected1[j][2][ind])
                    cell.style.backgroundColor = 'black';
                } else {
                    cell.setAttribute('alt', maxWidth)
                    cell.style.backgroundColor = cellColor;
                }
                cell.setAttribute('cellColor', cellColor);
            }

            var dur = toFraction(Math.max.apply(Math, selected1[j][2]));
            var row = docById('mkbNoteDurationRow');
            var cell = row.insertCell();
            cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 1 + 'px';
            cell.style.width = noteMaxWidth;
            cell.style.minWidth = cell.style.width;
            cell.style.maxWidth = cell.style.width;
            cell.style.lineHeight = 60 + '%';
            cell.style.textAlign = 'center';
            cell.innerHTML = dur[0].toString() + '/' + dur[1].toString();
            cell.setAttribute('id', 'cells-' + j);
            cell.setAttribute('start', selected1[j][3]);
            cell.style.backgroundColor = platformColor.rhythmcellcolor;
        }     
        this.makeClickable();   
    }

    this._createAddRowPieSubmenu = function() {
        docById('wheelDivptm').style.display = '';
        docById('wheelDivptm').style.zIndex = '300';
        var pitchLabels =  ['do', 're', 'mi', 'fa', 'sol', 'la', 'ti'];
        var hertzLabels = [261, 294, 327, 348, 392, 436, 490, 523];
        const VALUESLABEL = ['pitch', 'hertz'];
        const VALUES = ['imgsrc: images/chime.svg', 'imgsrc: images/synth.svg'];
        var valueLabel = [];
        for (var i = 0; i < VALUES.length; i++) {
            var label = _(VALUES[i]);
            valueLabel.push(label);
        }

        this._menuWheel = new wheelnav('wheelDivptm', null, 200, 200);
        this._exitWheel = new wheelnav('_exitWheel', this._menuWheel.raphael);

        wheelnav.cssMode = true;

        this._menuWheel.keynavigateEnabled = false;
        this._menuWheel.slicePathFunction = slicePath().DonutSlice;
        this._menuWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._menuWheel.colors = [platformColor.paletteColors['pitch'][0],
                                  platformColor.paletteColors['pitch'][1]]
        this._menuWheel.slicePathCustom.minRadiusPercent = 0.3;
        this._menuWheel.slicePathCustom.maxRadiusPercent = 1.0;
        
        this._menuWheel.sliceSelectedPathCustom = this._menuWheel.slicePathCustom;
        this._menuWheel.sliceInitPathCustom = this._menuWheel.slicePathCustom;
        this._menuWheel.clickModeRotate = false;

        this._menuWheel.animatetime = 0; // 300;
        this._menuWheel.createWheel(valueLabel);
        this._menuWheel.navItems[0].setTooltip(_('pitch'));
        this._menuWheel.navItems[1].setTooltip(_('hertz'));

        this._exitWheel.colors = platformColor.exitWheelcolors;
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
        this._exitWheel.slicePathCustom.maxRadiusPercent = 0.25;
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.clickModeRotate = false;
        this._exitWheel.createWheel(['x', ' ']);

        var x = docById('addnotes').getBoundingClientRect().x;
        var y = docById('addnotes').getBoundingClientRect().y;

        docById('wheelDivptm').style.position = 'absolute';
        docById('wheelDivptm').style.height = '300px';
        docById('wheelDivptm').style.width = '300px';
        docById('wheelDivptm').style.left = Math.min(this._logo.blocks.turtles._canvas.width - 200, Math.max(0, x * this._logo.blocks.getStageScale())) + 'px';
        docById('wheelDivptm').style.top = Math.min(this._logo.blocks.turtles._canvas.height - 250, Math.max(0, y * this._logo.blocks.getStageScale())) + 'px';

        var that = this;
        this._exitWheel.navItems[0].navigateFunction = function () {
            docById('wheelDivptm').style.display = 'none';
            that._menuWheel.removeWheel();
            that._exitWheel.removeWheel();
        };

        var __selectionChanged = function () {
            var label = VALUESLABEL[that._menuWheel.selectedNavItemIndex];
            var newBlock = that._logo.blocks.blockList.length;
            if (label === 'pitch') {
                for (var i = 0; i < pitchLabels.length; i++) {
                    if (pitchLabels[i].indexOf(last(that.layout)[0]) !== -1 || last(that.layout)[0].indexOf(pitchLabels[i]) !== -1) {
                        break;
                    }
                }
                var rLabel = pitchLabels[(i+1)%pitchLabels.length];
                var rArg = last(that.layout)[1];
                if ((i + 1) % pitchLabels.length === 0) {
                    rArg += 1;
                }
            } else {
                var rLabel = 'hertz';
                var rArg = 392;
                var flag = false;
                for (var i = 0; i < hertzLabels.length; i++) {
                    flag = false
                    for (var j = 0; j < that.layout.length; j++) {
                        if (that.layout[j][0] === 'hertz') {
                            if (that.layout[j][1] === hertzLabels[i]) {
                                flag = true;
                                break;
                            }
                        }
                    }

                    if (flag) {
                        continue;
                    }

                    rArg = hertzLabels[i];
                    break;
                }
            }
            
            switch(label) {
                case 'pitch':
                    console.log('loading new pitch block');
                    that._logo.blocks.loadNewBlocks([[0, ['pitch', {}], 0, 0, [null, 1, 2, null]], [1, ['solfege', {'value': rLabel}], 0, 0, [0]], [2, ['number', {'value': rArg}], 0, 0, [0]]]);
                    break;
                case 'hertz':
                    console.log('loading new Hertz block');
                    that._logo.blocks.loadNewBlocks([[0, ['hertz', {}], 0, 0, [null, 1, null]], [1, ['number', {'value': rArg}], 0, 0, [0]]]);
                    break;
            }    
            var aboveBlock = last(that.layout)[2];
            setTimeout(that._addNotesBlockBetween(aboveBlock, newBlock), 500);
            that.layout.push([rLabel, rArg, newBlock]);
            that._sortLayout();
        }

        for (var i = 0; i < valueLabel.length; i++) {
            this._menuWheel.navItems[i].navigateFunction = __selectionChanged;
        }
    }

    this._addNotesBlockBetween = function(aboveBlock, block) {
        
        var belowBlock = last(this._logo.blocks.blockList[aboveBlock].connections);
        this._logo.blocks.blockList[aboveBlock].connections[this._logo.blocks.blockList[aboveBlock].connections.length - 1] = block;
        this._logo.blocks.blockList[belowBlock].connections[0] = block;
        this._logo.blocks.blockList[block].connections[0] = aboveBlock;
        this._logo.blocks.blockList[block].connections[this._logo.blocks.blockList[block].connections.length - 1] = belowBlock;   
        this._logo.blocks.adjustDocks(this.blockNo, true);
        this._logo.blocks.clampBlocksToCheck.push([this.blockNo, 0]);
        this._logo.blocks.refreshCanvas();
    }

    this._sortLayout = function() {
        var that = this;
        this.layout.sort(
            function(a, b){
                var aValue, bValue;
                if (a[0] == 'hertz') {
                    aValue = a[1];
                } else {
                    aValue = noteToFrequency(a[0] + a[1], that._logo.keySignature[0])
                }
                if (b[0] == 'hertz') {
                    bValue = b[1];
                } else {
                    bValue = noteToFrequency(b[0] + b[1], that._logo.keySignature[0])
                }
                return aValue - bValue;
            }
        )

        var unique = [];
        this.remove = [];
        this.layout = this.layout.filter(
            function (item, pos){
                if( unique.indexOf(item[0]+item[1])===-1){
                    unique.push(item[0]+item[1])
                    return true;
                }
                that.remove = [that.layout[pos-1][2], that.layout[pos][2]]
                return false;
            }
        )
        this._selectedHelper.map(
            function (item) {
                if (item[2] === that.remove[1]) {
                    item[2] = that.remove[0];
                }
                return item
            }
        )
        if (this.remove.length) {
            this._removePitchBlock(this.remove[1])
        }

        if (that.keyboardShown) {
            that._createKeyboard();
        } else {
            that._createTable();
        }
    }

    this._removePitchBlock = function(blockNo) {
        var c0 = this._logo.blocks.blockList[blockNo].connections[0];
        var c1 = last(this._logo.blocks.blockList[blockNo].connections);
        if (this._logo.blocks.blockList[c0].name === "musickeyboard") {
            this._logo.blocks.blockList[c0].connections[1] = c1;
        } else {
            this._logo.blocks.blockList[c0].connections[this._logo.blocks.blockList[c0].connections.length-1] = c1;
        }
        if (c1) {
            this._logo.blocks.blockList[c1].connections[0] = c0;
        }

        this._logo.blocks.blockList[blockNo].connections[this._logo.blocks.blockList[blockNo].connections.length - 1] = null;
        this._logo.blocks.sendStackToTrash(this._logo.blocks.blockList[blockNo]);
        this._logo.blocks.adjustDocks(this.blockNo, true);
        this._logo.blocks.clampBlocksToCheck.push([this.blockNo, 0]);
        this._logo.blocks.refreshCanvas();
    }

    this._createColumnPieSubmenu = function(index, condition) {
        index = parseInt(index);
        docById('wheelDivptm').style.display = '';
        docById('wheelDivptm').style.zIndex = '300';

        var accidentals = ['𝄪', '♯', '♮', '♭', '𝄫' ];
        var noteLabels = ['ti', 'la', 'sol', 'fa', 'mi', 're', 'do'];

        if (condition === 'synthsblocks'){
            var noteLabels = ['261', '294', '327', '348', '392', '436', '490', '523'];
        }
        

        this._pitchWheel = new wheelnav('wheelDivptm', null, 600, 600);

        this._exitWheel = new wheelnav('_exitWheel', this._pitchWheel.raphael);
        if (condition === 'pitchblocks') {
            this._accidentalsWheel = new wheelnav('_accidentalsWheel', this._pitchWheel.raphael);
            this._octavesWheel = new wheelnav('_octavesWheel', this._pitchWheel.raphael);
        }

        wheelnav.cssMode = true;

        this._pitchWheel.keynavigateEnabled = false;
        this._pitchWheel.slicePathFunction = slicePath().DonutSlice;
        this._pitchWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        if (condition === 'pitchblocks') {
            this._pitchWheel.colors = platformColor.pitchWheelcolors;
            this._pitchWheel.slicePathCustom.minRadiusPercent = 0.2;
            this._pitchWheel.slicePathCustom.maxRadiusPercent = 0.5;
        } else if (condition === 'synthsblocks') {
            this._pitchWheel.titleRotateAngle = 0;
            this._pitchWheel.colors = platformColor.blockLabelsWheelcolors;
            this._pitchWheel.slicePathCustom.minRadiusPercent = 0.6;
            this._pitchWheel.slicePathCustom.maxRadiusPercent = 1;
            this._pitchWheel.titleRotateAngle = 90;
            this._pitchWheel.clickModeRotate = false;
        }

        this._pitchWheel.sliceSelectedPathCustom = this._pitchWheel.slicePathCustom;
        this._pitchWheel.sliceInitPathCustom = this._pitchWheel.slicePathCustom;

        this._pitchWheel.animatetime = 0; // 300;
        this._pitchWheel.createWheel(noteLabels);

        this._exitWheel.colors = platformColor.exitWheelcolors;
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
        this._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.clickModeRotate = false;
        this._exitWheel.createWheel(['x', ' ']);

        if (condition === 'pitchblocks') {
            this._accidentalsWheel.colors = platformColor.accidentalsWheelcolors;
            this._accidentalsWheel.slicePathFunction = slicePath().DonutSlice;
            this._accidentalsWheel.slicePathCustom = slicePath().DonutSliceCustomization();
            this._accidentalsWheel.slicePathCustom.minRadiusPercent = 0.50;
            this._accidentalsWheel.slicePathCustom.maxRadiusPercent = 0.75;
            this._accidentalsWheel.sliceSelectedPathCustom = this._accidentalsWheel.slicePathCustom;
            this._accidentalsWheel.sliceInitPathCustom = this._accidentalsWheel.slicePathCustom;

            var accidentalLabels = [];
            for (var i = 0; i < accidentals.length; i++) {
                accidentalLabels.push(accidentals[i]);
            }

            for (var i = 0; i < 9; i++) {
                accidentalLabels.push(null);
                this._accidentalsWheel.colors.push(platformColor.accidentalsWheelcolorspush);
            }

            this._accidentalsWheel.animatetime = 0; // 300;
            this._accidentalsWheel.createWheel(accidentalLabels);
            this._accidentalsWheel.setTooltips([_('double sharp'), _('sharp'), _('natural'), _('flat'), _('double flat')]);
        
            this._octavesWheel.colors = platformColor.octavesWheelcolors;
            this._octavesWheel.slicePathFunction = slicePath().DonutSlice;
            this._octavesWheel.slicePathCustom = slicePath().DonutSliceCustomization();
            this._octavesWheel.slicePathCustom.minRadiusPercent = 0.75;
            this._octavesWheel.slicePathCustom.maxRadiusPercent = 0.95;
            this._octavesWheel.sliceSelectedPathCustom = this._octavesWheel.slicePathCustom;
            this._octavesWheel.sliceInitPathCustom = this._octavesWheel.slicePathCustom;
            var octaveLabels = ['8', '7', '6', '5', '4', '3', '2', '1', null, null, null, null, null, null];
            this._octavesWheel.animatetime = 0; // 300;
            this._octavesWheel.createWheel(octaveLabels);
        }
        
        var x = docById('labelcol' + index).getBoundingClientRect().x;
        var y = docById('labelcol' + index).getBoundingClientRect().y;

        docById('wheelDivptm').style.position = 'absolute';
        docById('wheelDivptm').style.height = '300px';
        docById('wheelDivptm').style.width = '300px';
        docById('wheelDivptm').style.left = Math.min(this._logo.blocks.turtles._canvas.width - 200, Math.max(0, x * this._logo.blocks.getStageScale())) + 'px';
        docById('wheelDivptm').style.top = Math.min(this._logo.blocks.turtles._canvas.height - 250, Math.max(0, y * this._logo.blocks.getStageScale())) + 'px';
        
        index = this.layout.length - index - 1;
        var block = this.layout[index][2];
        var noteValue = this._logo.blocks.blockList[this._logo.blocks.blockList[block].connections[1]].value;

        if (condition === 'pitchblocks') {
            var octaveValue = this._logo.blocks.blockList[this._logo.blocks.blockList[block].connections[2]].value;
            var accidentalsValue = 2;

            for (var i = 0; i < accidentals.length; i++) {
                if (noteValue.indexOf(accidentals[i]) !== -1) {
                    accidentalsValue = i;
                    noteValue = noteValue.substr(0, noteValue.indexOf(accidentals[i]));
                    break;
                }
            }

            this._accidentalsWheel.navigateWheel(accidentalsValue)
            this._octavesWheel.navigateWheel(octaveLabels.indexOf(octaveValue.toString()))
            this._pitchWheel.navigateWheel(noteLabels.indexOf(noteValue))

        }
        
        var that = this;
        this._exitWheel.navItems[0].navigateFunction = function () {
            docById('wheelDivptm').style.display = 'none';
            that._pitchWheel.removeWheel();
            that._exitWheel.removeWheel();
            if (condition === 'pitchblocks') {
                that._accidentalsWheel.removeWheel();
                that._octavesWheel.removeWheel();
            }
            that._sortLayout();
        };

        var __hertzSelectionChanged = function () {
            blockValue = that._pitchWheel.navItems[that._pitchWheel.selectedNavItemIndex].title;
            var argBlock = that._logo.blocks.blockList[block].connections[1];
            that._logo.blocks.blockList[argBlock].text.text = blockValue;
            that._logo.blocks.blockList[argBlock].value = parseInt(blockValue);
            
            var z = that._logo.blocks.blockList[argBlock].container.children.length - 1;
            that._logo.blocks.blockList[argBlock].container.setChildIndex(that._logo.blocks.blockList[argBlock].text, z);
            that._logo.blocks.blockList[argBlock].updateCache()

            var cell = docById('labelcol' + (that.layout.length - index -1));
            that.layout[index][1] = parseInt(blockValue);
            cell.innerHTML = that.layout[index][0]+that.layout[index][1].toString();
            that._selectedHelper.map(
                function(item){
                    if (item[2]==that.layout[index][2]) {
                        item[1] = parseInt(blockValue);
                    }
                    return item
                }
            );
            
        }

        if (condition === 'synthsblocks') {
            for (var i = 0; i < noteLabels.length; i++) {
                this._pitchWheel.navItems[i].navigateFunction = __hertzSelectionChanged;
            }
        }

        var __selectionChanged = function () {
            var label = that._pitchWheel.navItems[that._pitchWheel.selectedNavItemIndex].title;
            var i = noteLabels.indexOf(label);
            if (condition === 'pitchblocks') {
                var attr = that._accidentalsWheel.navItems[that._accidentalsWheel.selectedNavItemIndex].title;
                var flag = false;
                if (attr !== '♮') {
                    label += attr;
                    flag = true;
                }
            }

            var noteLabelBlock = that._logo.blocks.blockList[block].connections[1];
            that._logo.blocks.blockList[noteLabelBlock].text.text = label;
            that._logo.blocks.blockList[noteLabelBlock].value = label;
            
            var z = that._logo.blocks.blockList[noteLabelBlock].container.children.length - 1;
            that._logo.blocks.blockList[noteLabelBlock].container.setChildIndex(that._logo.blocks.blockList[noteLabelBlock].text, z);
            that._logo.blocks.blockList[noteLabelBlock].updateCache();
            if (condition === 'pitchblocks') {
                var octave = Number(that._octavesWheel.navItems[that._octavesWheel.selectedNavItemIndex].title);
                that._logo.blocks.blockList[noteLabelBlock].blocks.setPitchOctave(that._logo.blocks.blockList[noteLabelBlock].connections[0], octave);
                
            }

            var cell = docById('labelcol' + (that.layout.length - index -1));
            that.layout[index][0] = label;
            that.layout[index][1] = octave;
            cell.innerHTML = that.layout[index][0] + that.layout[index][1].toString();
            var temp1 = label;
            if (temp1 in FIXEDSOLFEGE1) {
                var temp2 = FIXEDSOLFEGE1[temp1].replace(SHARP, '#').replace(FLAT, 'b') + octave;
            } else {
                var temp2 = temp1.replace(SHARP, '#').replace(FLAT, 'b') + octave;
            }

            that._selectedHelper.map(
                function(a){
                    if (a[2]==that.layout[index][2]) {
                        a[1]=temp2;
                    }
                    return a
                }
            );
        };

        var __pitchPreview = function () {
            var label = that._pitchWheel.navItems[that._pitchWheel.selectedNavItemIndex].title;
            var attr = that._accidentalsWheel.navItems[that._accidentalsWheel.selectedNavItemIndex].title;
            if (attr !== '♮') {
                label += attr;
            }

            var octave = Number(that._octavesWheel.navItems[that._octavesWheel.selectedNavItemIndex].title);
            var obj = getNote(label, octave, 0, that._logo.keySignature[0], false, null, that._logo.errorMsg, that._logo.synth.inTemperament);
            that._logo.synth.setMasterVolume(PREVIEWVOLUME);
            that._logo.setSynthVolume(0, DEFAULTVOICE, PREVIEWVOLUME);
            // that._logo.synth.trigger(0, [obj[0] + obj[1]], 1 / 8, DEFAULTVOICE, null, null);
            
            __selectionChanged();
        };

        if (condition === 'pitchblocks') {
            for (var i = 0; i < noteLabels.length; i++) {
                this._pitchWheel.navItems[i].navigateFunction = __pitchPreview;
            }

            for (var i = 0; i < accidentals.length; i++) {
                this._accidentalsWheel.navItems[i].navigateFunction = __pitchPreview;
            }
    
            for (var i = 0; i < 8; i++) {
                this._octavesWheel.navItems[i].navigateFunction = __pitchPreview;
            }
        }

    };

    this._createKeyboard = function() {
        document.onkeydown = null;

        var mkbTableDiv = docById('mkbTableDiv');
        mkbTableDiv.style.display = 'inline';
        mkbTableDiv.style.visibility = 'visible';
        mkbTableDiv.style.border = '0px';
        mkbTableDiv.style.width = '300px';
        mkbTableDiv.innerHTML = '';

        mkbTableDiv.innerHTML = ' <div id="keyboardHolder2"><table class="white"><tbody><tr id="myrow"></tr></tbody></table><table class="black"><tbody><tr id="myrow2"></tr></tbody></table></div>'

        var keyboardHolder2 = docById('keyboardHolder2');
        keyboardHolder2.style.bottom = '10px';
        keyboardHolder2.style.left = '0px';
        keyboardHolder2.style.height = '145px'
        keyboardHolder2.style.width = '700px';
        keyboardHolder2.style.backgroundColor = 'white';


        var myNode = document.getElementById('myrow');
        myNode.innerHTML = '';
        var myNode = document.getElementById('myrow2');
        myNode.innerHTML = '';

        // For the button callbacks
        var that = this;
        if (this.noteNames.length === 0) {
            for (var i = 0; i < PITCHES3.length; i++) {
                this.noteNames.push(PITCHES3[i]);
                this.octaves.push(4);
                if (i === 4) {
                    this.noteNames.push(null); // missing black key
                    this.octaves.push(4);
                }
            }

            this.noteNames.push(PITCHES3[0]);
            this.octaves.push(5);
        }
        
        document.getElementById('keyboardHolder2').style.display = 'block';
        that.idContainer = [];
        var myrowId = 0;
        var myrow2Id = 0;

        for (var p = 0; p < this.layout.length; p++){
            if (this.layout[p][0] === null) {
                var parenttbl2 = document.getElementById('myrow2');
                var newel2 = document.createElement('td');
                newel2.setAttribute('id','blackRow'+myrow2Id.toString());
                if ([2,6,9,13,16,20].indexOf(myrow2Id) !== -1) {
                    parenttbl2.appendChild(newel2);
                    var el = docById('blackRow'+myrow2Id.toString());
                    el.style.background = 'transparent';
                    el.style.border = 'none';
                    el.style.zIndex = '10';
                    el.style.position = 'relative';
                    p--;
                    myrow2Id++;
                    continue;
                }
                newel2.setAttribute('alt', this.layout[p][0] + '__' + this.layout[p][1] + '__' + this.layout[p][2]);
                that.idContainer.push(['blackRow' + myrow2Id.toString(), this.layout[p][2]]);
                myrow2Id++;
                newel2.innerHTML = '';
                newel2.style.visibility = 'hidden';
                newel2.style.position = 'relative';
                newel2.style.zIndex = '200';
                parenttbl2.appendChild(newel2);
            } else if (this.layout[p][0] === 'hertz') {
                var parenttbl = document.getElementById('myrow');
                var newel = document.createElement('td');
                newel.style.textAlign = 'center';
                newel.setAttribute('id', 'whiteRow' + myrowId.toString());
                newel.setAttribute('alt', this.layout[p][0] + '__' + this.layout[p][1] + '__' + this.layout[p][2]);
                that.idContainer.push(['whiteRow' + myrowId.toString(), this.layout[p][2]]);
                newel.innerHTML = '<small>(' + String.fromCharCode(WHITEKEYS[myrowId]) + ')</small><br/>' + this.layout[p][1];
                myrowId++;
                newel.style.position = 'relative';
                newel.style.zIndex = '100';
                parenttbl.appendChild(newel);
            } else if (this.layout[p][0].indexOf(SHARP) !== -1 || this.layout[p][0].indexOf('#') !== -1) {
                var parenttbl2 = document.getElementById('myrow2');
                var newel2 = document.createElement('td');
                newel2.setAttribute('id','blackRow'+myrow2Id.toString());
                newel2.style.textAlign = 'center';
                if ([2,6,9,13,16,20].indexOf(myrow2Id) !== -1) {
                    parenttbl2.appendChild(newel2);
                    var el = docById('blackRow' + myrow2Id.toString());
                    el.style.background = 'transparent';
                    el.style.border = 'none';
                    el.style.zIndex = '10';
                    el.style.position = 'relative';
                    p--;
                    myrow2Id++;
                    continue;
                }
                newel2.setAttribute('alt', this.layout[p][0] + '__' + this.layout[p][1] + '__' + this.layout[p][2]);
                that.idContainer.push(['blackRow' + myrow2Id.toString(), this.layout[p][2]]);
                                
                var nname = this.layout[p][0].replace(SHARP, '').replace('#', '');
                if (SOLFEGENAMES.indexOf(nname) !== -1) {
                    newel2.innerHTML = '<small>('+String.fromCharCode(BLACKKEYS[myrow2Id])+')</small><br/>'+i18nSolfege(nname) + SHARP + this.layout[p][1];
                } else {
                    newel2.innerHTML = '<small>('+String.fromCharCode(BLACKKEYS[myrow2Id])+')</small><br/>'+this.layout[p][0] + this.layout[p][1];
                }
                myrow2Id++;
                newel2.style.position = 'relative';
                newel2.style.zIndex = '200';
                parenttbl2.appendChild(newel2);
                
            } else if (this.layout[p][0].indexOf(FLAT) !== -1 || this.layout[p][0].indexOf('b') !== -1) {
                var parenttbl2 = document.getElementById('myrow2');
                var newel2 = document.createElement('td');
                var elementid2 = document.getElementsByTagName('td').length
                newel2.setAttribute('id','blackRow'+myrow2Id.toString());
                newel2.style.textAlign = 'center';
                if ([2,6,9,13,16,20].indexOf(myrow2Id) !== -1) {
                    parenttbl2.appendChild(newel2);
                    var el = docById('blackRow' + myrow2Id.toString());
                    el.style.background = 'transparent';
                    el.style.border = 'none';
                    el.style.zIndex = '10';
                    el.style.position = 'relative';
                    p--;
                    myrow2Id++;
                    continue;
                }
                newel2.setAttribute('alt', this.layout[p][0] + '__' + this.layout[p][1] + '__' + this.layout[p][2]);
                that.idContainer.push(['blackRow' + myrow2Id.toString(), this.layout[p][2]]);
                var nname = this.layout[p][0].replace(FLAT, '').replace('b', '');
                if (SOLFEGENAMES.indexOf(nname) !== -1) {
                    newel2.innerHTML = '<small>('+String.fromCharCode(BLACKKEYS[myrow2Id])+')</small><br/>'+i18nSolfege(nname) + FLAT + this.layout[p][1];
                } else {
                    newel2.innerHTML = '<small>('+String.fromCharCode(BLACKKEYS[myrow2Id])+')</small><br/>'+this.layout[p][0] + this.layout[p][1];
                }
                myrow2Id++;
                newel2.style.position = 'relative';
                newel2.style.zIndex = '200';
                parenttbl2.appendChild(newel2);
            } else {
                var parenttbl = document.getElementById('myrow');
                var newel = document.createElement('td');
                var elementid = document.getElementsByTagName('td').length

                newel.setAttribute('id', 'whiteRow' + myrowId.toString());
                newel.style.textAlign = 'center';
                newel.setAttribute('alt', this.layout[p][0] + '__' + this.layout[p][1] + '__' + this.layout[p][2]);
                that.idContainer.push(['whiteRow' + myrowId.toString(), this.layout[p][2]]);
                
                if (SOLFEGENAMES.indexOf(this.layout[p][0]) !== -1) {
                    newel.innerHTML = '<small>('+String.fromCharCode(WHITEKEYS[myrowId])+')</small><br/>'+i18nSolfege(this.layout[p][0]) + this.layout[p][1];
                } else {
                    newel.innerHTML = '<small>('+String.fromCharCode(WHITEKEYS[myrowId])+')</small><br/>'+this.layout[p][0] + this.layout[p][1];
                }
                myrowId++;
                newel.style.position = 'relative';
                newel.style.zIndex = '100';
                parenttbl.appendChild(newel);
            }
        }

        for (var i = 0; i < that.idContainer.length; i++) {
            this.loadHandler(document.getElementById(that.idContainer[i][0]), i, that.idContainer[i][1]);
        }
    
        this.addKeyboardShortcuts();
    };

    this._save = function() {
        this.processSelected();
        console.log('generating keyboard pitches for: ' + selected1);
        var newStack = [[0, ['action', {'collapsed':false}], 100, 100, [null, 1, null, null]], [1, ['text', {'value': _('action')}], 0, 0, [0]]];
        var endOfStackIdx = 0;

        for (var i = 0; i < selected1.length; i++) {
            note = selected1[i];

            // Add the Note block and its value
            var idx = newStack.length;
            newStack.push([idx, 'newnote', 0, 0, [endOfStackIdx, idx + 2, idx + 1, null]]);
            var n = newStack[idx][4].length;
            if (i === 0) {  // the action block
                newStack[endOfStackIdx][4][n - 2] = idx;
            } else {  // the previous note block
                newStack[endOfStackIdx][4][n - 1] = idx;
            }

            var endOfStackIdx = idx;

            var delta = 5;

                // Add a vspace to prevent divide block from obscuring the pitch block.
            newStack.push([idx + 1, 'vspace', 0, 0, [idx, idx + delta]]);

            // note value is saved as a fraction
            newStack.push([idx + 2, 'divide', 0, 0, [idx, idx + 3, idx + 4]]);
            var maxWidth = Math.max.apply(Math, note[2]);

            var obj = toFraction(maxWidth);
            newStack.push([idx + 3, ['number', {'value': obj[0]}], 0, 0, [idx + 2]]);
            newStack.push([idx + 4, ['number', {'value': obj[1]}], 0, 0, [idx + 2]]);

            var thisBlock = idx + delta;
     
            // We need to point to the previous note or pitch block.
            var previousBlock = idx+1;  // Note block
      
            // The last connection in last pitch block is null.
            var lastConnection = null;

            // if (typeof(pitches[i][0]) === 'string') {
            for (var j = 0; j < note[0].length; j++) {
                if (j > 0) {
                    if (typeof(note[0][j-1]) === 'string') {
                        thisBlock = previousBlock+3;
                    } else {
                        thisBlock = previousBlock+2;
                    }
                    var n = newStack[previousBlock][4].length;
                    newStack[previousBlock][4][n-1] = thisBlock;
                }
                if (typeof(note[0][j]) === 'string') {
                    newStack.push([thisBlock, 'pitch', 0, 0, [previousBlock, thisBlock + 1, thisBlock + 2, lastConnection]]);
                    if (['#', 'b', '♯', '♭'].indexOf(note[0][j][1]) !== -1) {
                        newStack.push([thisBlock + 1, ['solfege', {'value': SOLFEGECONVERSIONTABLE[note[0][j][0]] + note[0][j][1]}], 0, 0, [thisBlock]]);
                        newStack.push([thisBlock + 2, ['number', {'value': note[0][j][note[0][j].length - 1]}], 0, 0, [thisBlock]]);
                    } else {
                        newStack.push([thisBlock + 1, ['solfege', {'value': SOLFEGECONVERSIONTABLE[note[0][j][0]]}], 0, 0, [thisBlock]]);
                        newStack.push([thisBlock + 2, ['number', {'value': note[0][j][note[0][j].length-1]}], 0, 0, [thisBlock]]);
                    }
                    
                } else {
                    newStack.push([thisBlock, 'hertz', 0, 0, [previousBlock, thisBlock + 1, lastConnection]]);
                    newStack.push([thisBlock + 1, ['number', {'value': note[0][j]}], 0, 0, [thisBlock]]);
                }
                previousBlock = thisBlock
            }
        }
        this._logo.blocks.loadNewBlocks(newStack);
    };

    this.clearBlocks = function() {
        this.noteNames = [];
        this.octaves = [];
    };

    function sleep(milliseconds) {
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > milliseconds) {
                break;
            }
        }
    };

    this._addButton = function(row, icon, iconSize, label) {
        var cell = row.insertCell(-1);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/' + icon + '" title="' + label + '" alt="' + label + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
        cell.style.width = BUTTONSIZE + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = cell.style.width;
        cell.style.minHeight = cell.style.height;
        cell.style.maxHeight = cell.style.height;
        cell.style.backgroundColor = platformColor.selectorBackground;

        cell.onmouseover=function() {
            this.style.backgroundColor = platformColor.selectorBackgroundHOVER;
        };

        cell.onmouseout=function() {
            this.style.backgroundColor = platformColor.selectorBackground;
        };

        return cell;
    };

    function __keyPressed(event) {
        var that = this;
        if (docById('labelDiv').classList.contains('hasKeyboard')) {
            return;
        }

        if (_THIS_IS_MUSIC_BLOCKS_) {
            if (docById('BPMInput').classList.contains('hasKeyboard')) {
                return;
            }

            if (docById('musicratio1').classList.contains('hasKeyboard')) {
                return;
            }

            if (docById('musicratio2').classList.contains('hasKeyboard')) {
                return;
            }

            if (docById('dissectNumber').classList.contains('hasKeyboard')) {
                return;
            }

            if (docById('timbreName') !== null) {
                if (docById('timbreName').classList.contains('hasKeyboard')) {
                    return;
                }
            }
        }

        const BACKSPACE = 8;
        const TAB = 9;

        /*
        if (event.keyCode === TAB || event.keyCode === BACKSPACE) {
            // Prevent browser from grabbing TAB key
            event.preventDefault();
        }
        */

        const ESC = 27;
        const ALT = 18;
        const CTRL = 17;
        const SHIFT = 16;
        const RETURN = 13;
        const SPACE = 32;
        const HOME = 36;
        const END = 35;
        const PAGE_UP = 33;
        const PAGE_DOWN = 34;
        const KEYCODE_LEFT = 37;
        const KEYCODE_RIGHT = 39;
        const KEYCODE_UP = 38;
        const KEYCODE_DOWN = 40;
        const DEL = 46;
        const V = 86;

        // Shortcuts for creating new notes
        const KEYCODE_D = 68; // do
        const KEYCODE_R = 82; // re
        const KEYCODE_M = 77; // mi
        const KEYCODE_F = 70; // fa
        const KEYCODE_S = 83; // so
        const KEYCODE_L = 76; // la
        const KEYCODE_T = 84; // ti

        // Check for RETURN in search widget ahead of other events.
        if (event.keyCode === RETURN && docById('search').value.length > 0) {
            doSearch();
        }

        if (_THIS_IS_MUSIC_BLOCKS_) {
            var disableKeys = docById('lilypondModal').style.display === 'block' || searchWidget.style.visibility === 'visible' || docById('planet-iframe').style.display === '' || docById('paste').style.visibility === 'visible' || docById('wheelDiv').style.display === '' || logo.turtles.running();
        } else {
            var disableKeys = searchWidget.style.visibility === 'visible' || docById('paste').style.visibility === 'visible' || logo.turtles.running();
        }

        var disableArrowKeys = _THIS_IS_MUSIC_BLOCKS_ && (docById('sliderDiv').style.visibility === 'visible' || docById('tempoDiv').style.visibility === 'visible');

        if (event.altKey && !disableKeys) {
            switch (event.keyCode) {
            case 66: // 'B'
                save.saveBlockArtwork();
                break;
            case 67: // 'C'
                blocks.prepareStackForCopy();
                break;
            case 68: // 'D'
                palettes.dict['myblocks'].promptMacrosDelete()
                break;
            case 69: // 'E'
                _allClear();
                break;
            case 80: // 'P'
                // logo.playback(-1);
                break;
            case 82: // 'R'
                that._doFastButton();
                break;
            case 83: // 'S'
                logo.doStopTurtle();
                break;
            case 86: // 'V'
                blocks.pasteStack();
                break;
            case 72:  // 'H' save block help
                _saveHelpBlocks();
                break;
            }
        } else if (event.ctrlKey) {
            switch (event.keyCode) {
            case V:
                pasteBox.createBox(turtleBlocksScale, 200, 200);
                pasteBox.show();
                docById('paste').style.left = (pasteBox.getPos()[0] + 10) * turtleBlocksScale + 'px';
                docById('paste').style.top = (pasteBox.getPos()[1] + 10) * turtleBlocksScale + 'px';
                docById('paste').focus();
                docById('paste').style.visibility = 'visible';
                update = true;
                break;
            }
        } else if (event.shiftKey && !disableKeys) {
            switch (event.keyCode) {
            case KEYCODE_D:
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    __makeNewNote(5, 'do');
                }
                break;
            case KEYCODE_R:
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    __makeNewNote(5, 're');
                }
                break;
            case KEYCODE_M:
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    __makeNewNote(5, 'mi');
                }
                break;
            case KEYCODE_F:
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    __makeNewNote(5, 'fa');
                }
                break;
            case KEYCODE_S:
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    __makeNewNote(5, 'sol');
                }
                break;
            case KEYCODE_L:
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    __makeNewNote(5, 'la');
                }
                break;
            case KEYCODE_T:
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    __makeNewNote(5, 'ti');
                }
                break;
            }
        } else {
            if (docById('paste').style.visibility === 'visible' && event.keyCode === RETURN) {
                if (docById('paste').value.length > 0) {
                    pasted();
                }
            } else if (!disableKeys) {
                switch (event.keyCode) {
                case END:
                    blocksContainer.y = -blocks.bottomMostBlock() + logo.canvas.height / 2;
                    break;
                case PAGE_UP:
                    blocksContainer.y += logo.canvas.height / 2;
                    stage.update();
                    break;
                case PAGE_DOWN:
                    blocksContainer.y -= logo.canvas.height / 2;
                    stage.update();
                    break;
                case DEL:
                    blocks.extract();
                    break;
                case KEYCODE_UP:
                    if (disableArrowKeys) {} else if (blocks.activeBlock != null) {
                        blocks.moveStackRelative(blocks.activeBlock, 0, -STANDARDBLOCKHEIGHT / 2);
                        blocks.blockMoved(blocks.activeBlock);
                        blocks.adjustDocks(blocks.activeBlock, true);
                    } else if (palettes.mouseOver) {
                        palettes.menuScrollEvent(1, 10);
                        palettes.hidePaletteIconCircles();
                    } else if (palettes.activePalette != null) {
                        palettes.activePalette.scrollEvent(STANDARDBLOCKHEIGHT, 1);
                    } else if (scrollBlockContainer) {
                        blocksContainer.y -= 20;
                    }
                    stage.update();
                    break;
                case KEYCODE_DOWN:
                    if (disableArrowKeys) {} else if (blocks.activeBlock != null) {
                        blocks.moveStackRelative(blocks.activeBlock, 0, STANDARDBLOCKHEIGHT / 2);
                        blocks.blockMoved(blocks.activeBlock);
                        blocks.adjustDocks(blocks.activeBlock, true);
                    } else if (palettes.mouseOver) {
                        palettes.menuScrollEvent(-1, 10);
                        palettes.hidePaletteIconCircles();
                    } else if (palettes.activePalette != null) {
                        palettes.activePalette.scrollEvent(-STANDARDBLOCKHEIGHT, 1);
                    } else if (scrollBlockContainer) {
                        blocksContainer.y += 20;
                    }
                    stage.update();
                    break;
                case KEYCODE_LEFT:
                    if (disableArrowKeys) {} else if (blocks.activeBlock != null) {
                        blocks.moveStackRelative(blocks.activeBlock, -STANDARDBLOCKHEIGHT / 2, 0);
                        blocks.blockMoved(blocks.activeBlock);
                        blocks.adjustDocks(blocks.activeBlock, true);
                    } else if (scrollBlockContainer) {
                        blocksContainer.x -= 20;
                    }
                    stage.update();
                    break;
                case KEYCODE_RIGHT:
                    if (disableArrowKeys) {} else if (blocks.activeBlock != null) {
                        blocks.moveStackRelative(blocks.activeBlock, STANDARDBLOCKHEIGHT / 2, 0);
                        blocks.blockMoved(blocks.activeBlock);
                        blocks.adjustDocks(blocks.activeBlock, true);
                    } else if (scrollBlockContainer) {
                        blocksContainer.x += 20;
                    }
                    stage.update();
                    break;
                case HOME:
                    if (palettes.mouseOver) {
                        var dy = Math.max(55 - palettes.buttons['rhythm'].y, 0);
                        palettes.menuScrollEvent(1, dy);
                        palettes.hidePaletteIconCircles();
                    } else if (palettes.activePalette != null) {
                        palettes.activePalette.scrollEvent(-palettes.activePalette.scrollDiff, 1);
                    } else {
                        this._findBlocks();
                    }
                    stage.update();
                    break;
                case TAB:
                    break;
                case SPACE:
                    if (turtleContainer.scaleX == 1) {
                        turtles.scaleStage(0.5);
                    } else {
                        turtles.scaleStage(1);
                    }
                    break;
                case ESC:
                    if (searchWidget.style.visibility === 'visible') {
                        searchWidget.style.visibility = 'hidden';
                    } else {
                        // toggle full screen
                        // _toggleToolbar();
                    }
                    break;
                case RETURN:
                    if (disableArrowKeys) {} else if (docById('search').value.length > 0) {
                        doSearch();
                    } else {
                        if (blocks.activeBlock == null || SPECIALINPUTS.indexOf(blocks.blockList[blocks.activeBlock].name) === -1) {
                            logo.runLogoCommands();
                        }
                    }
                    break;
                case KEYCODE_D:
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        __makeNewNote(4, 'do');
                    }
                    break;
                case KEYCODE_R:
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        __makeNewNote(4, 're');
                    }
                    break;
                case KEYCODE_M:
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        __makeNewNote(4, 'mi');
                    }
                    break;
                case KEYCODE_F:
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        __makeNewNote(4, 'fa');
                    }
                    break;
                case KEYCODE_S:
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        __makeNewNote(4, 'sol');
                    }
                    break;
                case KEYCODE_L:
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        __makeNewNote(4, 'la');
                    }
                    break;
                case KEYCODE_T:
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        __makeNewNote(4, 'ti');
                    }
                    break;
                default:
                    break;
                }
            }

            // Always store current key so as not to mask it from
            // the keyboard block.
            currentKeyCode = event.keyCode;
        }
    };
};
