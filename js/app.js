const BLOCK_INFO = `
    <div class="block-info-div">
        <div class="block-info __CUSTOM_CLASS__" onclick="onClickInfoBlock(event)">
            <div class="info">
                <span>__INFO__</span>
            </div>
        </div>
        <div class="mark-icon" style="position: absolute;" onclick="onClickInfoBlock(event)">
            <i class="fa-solid fa-x" style="font-size: calc(2vw + 1em); height:100%; "></i>
        </div>
    </div>
`;

const LINE = `
    <div class="parent-line">
        <div class="line __CUSTOM_CLASS__">
            __CHILDREN__
        </div>
    </div>
`;

const DIE = `
    <div class="dice">
        <i class="fa-solid fa-dice-__NUMBER__ dice-__COLOR__"></i>
    </div>
`;

const EXT_NUMBERS = [ 'zero', 'one', 'two', 'three', 'four', 'five', 'six'];

const getDefaultSheet = () => {
    let defaultItems = [...Array(11)].map( (_, index) => BLOCK_INFO.replace('__INFO__', index+2).replace('__CUSTOM_CLASS__', ''));
    const ALL_POINTS = BLOCK_INFO.replace('__INFO__', 0).replace('__CUSTOM_CLASS__', '');
    const LOCK_ICON = '<div><i class="fas fa-lock-open icon"></i></div>'
    const LOCK_ROW = BLOCK_INFO.replace('<span>__INFO__</span>', LOCK_ICON).replace('__CUSTOM_CLASS__', 'circle');
    let reverseDefaultItems = [...defaultItems].reverse();
    defaultItems.push(LOCK_ROW);
    defaultItems.push(ALL_POINTS);
    reverseDefaultItems.push(LOCK_ROW);
    reverseDefaultItems.push(ALL_POINTS);
    return [
        defaultItems,
        defaultItems,
        reverseDefaultItems,
        reverseDefaultItems,
    ];
};

const getSheetByName = name => {
    switch ( name ) {
        default: return getDefaultSheet();
    }
};

const  stringToHTML = function (str) {
	var parser = new DOMParser();
	var doc = parser.parseFromString(str, 'text/html');
	return doc.body;
};

const buildLine = (children, customClass = '') => {
    return LINE.replace('__CHILDREN__', children.join('\n'))
               .replace('__CUSTOM_CLASS__', customClass); 
};
const getColorsLines = () => {
    return [
        'line-red',
        'line-yellow',
        'line-green',
        'line-blue'
    ];
};
const buildSheet = name => {
    let dataset = getSheetByName( name );
    let colors = getColorsLines();
    return dataset.map( (children, index) => {
        return buildLine(children, colors[index] || colors[0]);
    }).join('\n');
}

const handleDisabledBlocks = ( lineEl ) => {
    let elements = [...lineEl.querySelectorAll('.block-info-div')].reverse();
    let disabled = false;
    elements.forEach( el => {
        if( el.classList.contains('mark') ) { disabled = true; }
        if( disabled ) { el.setAttribute('disabled', ''); }
        else { el.removeAttribute('disabled'); }
    })
}

const onClickInfoBlock = function(event){
    const el = event.currentTarget;
    const blockInfoDiv = el.parentElement;
    const lineEl = blockInfoDiv.parentElement;
    if(blockInfoDiv.classList.contains('mark')) {
        blockInfoDiv.classList.remove('mark');
    } else {
        blockInfoDiv.classList.add('mark');
    }
    handleDisabledBlocks(lineEl);
    calcScoreLine(lineEl);
    changeLastSelection(blockInfoDiv);
}

const getDie = ( dieNumber, dieColor = 'white' ) => {
    let die = DIE.replace('__NUMBER__', EXT_NUMBERS[dieNumber]).replace('__COLOR__', dieColor);
    let dieEl = stringToHTML(die).firstChild;
    dieEl.querySelector('i').setAttribute('die-color', dieColor);
    return dieEl;

};

buildDieForLines = () => {
    let lineColors = ['red', 'yellow', 'green', 'blue'];
    let diceEl = lineColors.map( color => {
        let die = getDie(5, color);
        document.querySelector('.dice-lines').appendChild(die);
        return die;
    });
    
    return diceEl;
}
buildDieForLines();
const analizeDie = ( die ) => {
    let classDieNumber = [...die.classList].find(className => className.match(/\bdice\b\-\d/));
    let classDieColor = [...die.classList].find(className => className.match(/\bdice\b\-\w+/i));
    let [ dieNumber ] = classDieNumber.match(/\d/i);
    return ({classColorName: classDieColor, className: classDieNumber, number: parseInt( dieNumber )});
};

const getDiceInfo = ( dice ) => {
    let iconsDice = dice.tagName === 'I' ? [...dice.classList] : [...dice.querySelector('i').classList];
    let classDiceNumber = '(' + EXT_NUMBERS.map(suffix => `\\b${suffix}\\b`).join('|') + ')';
    let classDiceIcon = iconsDice.find(className => className.match(new RegExp(`\\bfa-dice\\b\\-${classDiceNumber}`, 'i')));
    let classDiceColor = iconsDice.find(className => className.match(new RegExp(`\\bdice\\b\\-\\w+`, 'i')));
    if(!classDiceColor) debugger;
    let extensionNumber = classDiceIcon.replace('fa-dice-', '');
    return {
        classNumber: classDiceIcon, 
        classColor: classDiceColor,
        number: EXT_NUMBERS.findIndex(extNumber => extNumber === extensionNumber)
    };
}

const getTotalizerColor = ( totalizer ) => {
    let classDiceColor = [...totalizer.classList].find(className => className.match(new RegExp(`\\bdice\\b\\-\\w+`, 'i')));
    return classDiceColor;
}

const getDicesByClassColor = ( classColor ) => {
    return document.querySelectorAll(`.${classColor}:not(.totalizer)`);
}

function rollDice() {
    const dice = [...document.querySelectorAll(".dice > i")];
    dice.forEach((curDice) => {
       let number = getRandomNumber(1, 6);
       let { classNumber } = getDiceInfo(curDice);
       toggleClasses(curDice, classNumber, `fa-dice-${EXT_NUMBERS[number]}`);
    });
    
    const totalizer = [...document.querySelectorAll(".totalizer")];
    const [ primaryDie, secondDie ] = [...document.querySelectorAll('.default-dice > .dice > i')].map( getDiceInfo );
    totalizer.forEach( tot => {
        let dieColorClass = getTotalizerColor(tot);
        let {primary, second} = [...getDicesByClassColor(dieColorClass)].reduce((acc, die) => {
            const {classColor, number} = getDiceInfo(die);
            acc.primary = primaryDie.number + secondDie.number;
            acc.second = acc.primary;
            if(classColor !== 'dice-white') {
                acc.primary = number + primaryDie.number;
                acc.second = number + secondDie.number;
            }
            return acc;
        }, {});
        tot.setAttribute('totalizer-data-primary', primary);
        tot.setAttribute('totalizer-data-second', second);
    })
}
  
function toggleClasses(die, oldClass, newClass) {
    die.classList.toggle(oldClass);
    die.classList.toggle(newClass);
}
  
function getRandomNumber(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
  
document.getElementById("roll-button").addEventListener("click", rollDice);
  
function getScoreByIndexRow(index){
    let marks = document.querySelectorAll('.line')[index].querySelectorAll('.mark').length;
    return (document.querySelectorAll('.score')[marks-1] || {textContent: "0"}).textContent;
}

const DomEl = {
    newDiv: (...classList) => {
        const div = document.createElement('DIV');
        if( classList && classList.length ) {
            div.classList.add(...classList);
        }
        return div;
    },
    newSpan: ( ...classList ) => {
        let span = document.createElement('SPAN');
        span.classList.add(...classList);
        return span;
    }
}

const getBlockInfo = () => {
    const blockInfo = DomEl.newDiv("block-info");
    const span = DomEl.newSpan();
    blockInfo.appendChild(span);
    return blockInfo;
};

const getBlockScore = () => {
    const blockScore = DomEl.newDiv("block-score");
    const spanMarkers = DomEl.newSpan('markers');
    const spanScore = DomEl.newSpan('score');
    blockScore.appendChild(spanMarkers);
    blockScore.appendChild(spanScore);
    return blockScore;
}

const getOrder = (curLine, maxLine, criteria = 'MIDDLE') => {
    switch( criteria ) {
        case 'MIDDLE':
        default:
            return curLine < maxLine/2 ? 'ASC' : 'DESC';
    }
};

const getLine = () => DomEl.newDiv("line");
const changeLastSelection = ( blockInfoDiv ) => {
    let lineEl = blockInfoDiv.parentElement;
    let numberSelection = blockInfoDiv.querySelector('.info > span').textContent;
    let color = [...lineEl.classList].find( className => {
        return className.match(/\bline-\w+\b/i);
    }).replace('line-', '');
    let newClass = `square-${color}`;
    let lastSelectedEl = document.querySelector('.last-selected');
    let oldClass = [...lastSelectedEl.classList].find( className => {
        return className.match(/\bsquare-\b\w+/i);
    });
    toggleClasses(lastSelectedEl, oldClass, newClass);
    lastSelectedEl.querySelector('.info > span').textContent = numberSelection;

}
const getScores = () => {
    const SCORES = [0, ...Array.from(Array(12))].reduce((acc, _, i) => {
        if( i === 0 ) acc.push(i);
        else acc.push(acc[i-1]+i);
        return acc;
    }, []);
    return SCORES;
}
const calcScoreLine = (line) => {
    let totalLineEl = line.querySelector('.block-info-div:last-child');
    let totalSpan = totalLineEl.querySelector('.info > span');
    let countMark = line.querySelectorAll('.mark').length;
    let scores = getScores();
    totalSpan.textContent = scores[countMark];
    // const MAX_LINES = 4;
    // let lineCount = 0;
    // const START_NUMBER = 2;
    // const SCORES = Array.from(Array(12)).reduce((acc, _, i) => {
    //     if( i === 0 ) acc.push(1);
    //     else acc.push(acc[i-1]+i+1);
    //     return acc;
    // }, []);
    
    // const lines = [];
    // const newLine = getLine();
    // const newBlock = getBlockInfo();
    // const newBlockScore = getBlockScore();
    // const infoBlocks = Array.from(Array(11)).map((_, i) => {
    //     let block = newBlock.cloneNode(true);
    //     block.firstElementChild.textContent = (i+START_NUMBER);
    //     return block;
    // });
    // const onClickInfoBlock = function(event){
    //     const el = event.currentTarget;
    //     const lineEl = el.parentElement;
    //     const lineIndex = Array.from(document.querySelectorAll('.line')).findIndex( el => el == lineEl);
    //     if(el.classList.contains('mark')) {
    //         el.classList.remove('mark');
    //     } else {
    //         el.classList.add('mark');
    //     }
    //     let totalScoreLine = document.querySelectorAll('.total-score-line')[lineIndex];
    //     totalScoreLine.textContent = getScoreByIndexRow(lineIndex);
    // }
    // while( lineCount < MAX_LINES ) {
    //     let curLine = newLine.cloneNode();
    //     let order = getOrder(lineCount, MAX_LINES);
    //     let newInfo = infoBlocks.map(e=>{
    //         let newNode = e.cloneNode(true);
    //         newNode.onclick = onClickInfoBlock;
    //         return newNode;
    //     });
    //     let orderedInfo = order === 'ASC' ? newInfo : newInfo.reverse();
    //     orderedInfo.forEach( node => curLine.appendChild(node) );
    //     lines.push( curLine ); 
    //     let emptySquare = DomEl.newDiv('empty-square');
    //     emptySquare.appendChild(DomEl.newSpan('total-score-line'));
    //     document.querySelector('.result .calc-score').appendChild(emptySquare);
    //     if(lineCount+1 < MAX_LINES) {
    //         let addDiv = DomEl.newDiv('icon-add');
    //         document.querySelector('.result .calc-score').appendChild(addDiv);
    //     }
    //     lineCount++;
    // }
    // let paperElement = document.querySelector(".paper");
    // let scoreElement = document.querySelector(".scores");
    // SCORES.forEach( (score, markers) => {
    //     let blockScore = newBlockScore.cloneNode(true);
    //     blockScore.querySelector(".markers").textContent = (markers+1) + 'x';
    //     blockScore.querySelector(".score").textContent = score;
    //     scoreElement.appendChild(blockScore);
    // });
    // lines.forEach( line => paperElement.appendChild( line ));
}

function onLoad(){
    let linesEl = [...stringToHTML(buildSheet()).children];
    let paper = document.querySelector('.paper');
    linesEl.forEach(line => {
        paper.appendChild(line);
    });
}