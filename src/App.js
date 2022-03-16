
import './App.css';

import wordlist from "./wordlist";
import {useEffect, useState} from "react";


const WordGuess = props => {

    const {guesses, curGuess, miniFilter, handleTileClick} = props;

    let guessListData = [];

    // add those current guesses
    if (guesses) {
        for (let curG of guesses) {
            const {word, score} = curG;
            let rowData = [];
            for (let i = 0; i < 5; i++) {
                let myClass;

                if (score[i] === "2") {
                    myClass = "Tile Green";
                } else if (score[i] === "1") {
                    myClass = "Tile Yellow";
                } else if (score[i] === "0") {
                    myClass = "Tile Red";
                } else
                    myClass = "Tile";

                rowData.push(
                    <div className={myClass} key={i}>
                        {word[i]}
                    </div>
                );
            }

            guessListData.push(
                <div className="TileRow" key={curG.word}>
                    { rowData }
                </div>
            )
        }
    }

    // add the last row
    let curGuessSafe = typeof(curGuess) == 'string' ? curGuess : "";

    let rowData = [];
    for (let i = 0; i < 5; i++) {
        let myClass;

        if (miniFilter[i] === "2") {
            myClass = "Tile Green";
        } else if (miniFilter[i] === "1") {
            myClass = "Tile Yellow";
        } else if (miniFilter[i] === "0") {
            myClass = "Tile Red";
        } else
            myClass = "Tile";

        rowData.push(
            <div className={myClass} data-index={i} onClick={handleTileClick} key={i}>
                {curGuessSafe[i]}
            </div>
        );
    }

    guessListData.push(
        <div className="TileRow" key="lastguess">
            {rowData}
        </div>
    )

    return (
        <div className="TileGrid">
            {guessListData}
        </div>
    );
}


const MatchList = props => {
    const {wordMatchList, answer, handleWordClick, frequencyMap} = props;

    let wordListData = [];
    for (let curWord of wordMatchList) {

        if (curWord === answer) {
            wordListData.push(
                <div key={curWord} className="MatchText" >
                    <span className="MatchWord Match">{curWord}</span>
                </div>
            )
        } else {
            const curStats = frequencyMap ?  frequencyMap[curWord] : null;
            const frequency = curStats ? curStats.frequency : null;
            const worst = curStats ? curStats.worst : null;
            const total = curStats? curStats.total : 0;
            const isBest = frequencyMap.bestWord === curWord;

            wordListData.push(
                <div key={curWord} className="MatchText" >
                    <span onClick={handleWordClick} className="MatchWord">{curWord}</span>
                    {frequency ? (
                        <span className={isBest ? "MatchFrequency Best" : "MatchFrequency"}>
                            {" (" + frequency.toFixed(2) + " avg, " +
                                worst.toString() + " worst, " +
                                total.toString() + " total)"}
                        </span>
                    ) : null
                    }
                </div>
            )
        }
    }

    return (
        <div>
            <div className="UIText">Found {wordMatchList.length} words!</div>
            {wordListData}
        </div>
    );

}

const fastScoreWordList = (wordList, answerWord, existingFilter) => {
    let totalMax = 0, averageLen, totalCount;
    let bestLen = Number.MAX_SAFE_INTEGER, worstLen = 0, bestCount = Number.MAX_SAFE_INTEGER;

    // clear the map
    let newMatchMap = {};

    for (const guessWord of wordList) {
        totalMax = 0;
        worstLen = 0;
        totalCount = 0;
        let validFilters = 0;
        if (answerWord) {
            // just check the answer word
            if (answerWord !== guessWord) {
                const newFilter = filterFromGuess(guessWord, answerWord, existingFilter);
                const newList = filterWordList(newFilter, wordList);

                const totalSolutions = newList.length;


                validFilters++;
                totalCount += totalSolutions;

                if (totalSolutions > worstLen) {
                    worstLen = totalSolutions;
                }
            }

        } else {
            // check every possible pattern
            for (let i = 0; i < 243; i++) {
                const newScore = i.toString(3).padStart(5, 0);
                const newFilter = updateFilterWithScore(guessWord, newScore, existingFilter);
                const newList = filterWordList(newFilter, wordList);
                const totalSolutions = newList.length;

                if (newList.length > 0) {
                    validFilters++;
                    totalCount += totalSolutions;

                    if (totalSolutions > worstLen) {
                        worstLen = totalSolutions;
                    }
                }
            }
        }


        averageLen = totalCount / validFilters;
        //console.log("==> Total average depth for " + guessWord + " = " + averageLen.toString() + ", total solutions = " + totalCount + ", valid filters =" + validFilters);
        newMatchMap[guessWord] = { frequency: averageLen, worst: worstLen, total: totalCount};
        if (averageLen < bestLen) {
            bestLen = averageLen;
            newMatchMap.bestWord = guessWord;
        }

        if (totalCount < bestCount) {
            bestCount = totalCount;
            newMatchMap.leastCount = guessWord;
        }

    }
    console.log(newMatchMap);
    return newMatchMap;

}

const scoreWordList = (wordList, answerWord, existingFilter) => {
    let totalMax = 0, averageLen, totalCount;
    let bestLen = Number.MAX_SAFE_INTEGER, worstLen = 0, bestCount = Number.MAX_SAFE_INTEGER;

    // clear the map
    let newMatchMap = {};

    if (wordList.length > 100) {
        console.log("word list too long!");
        return {};
    }
    for (const guessWord of wordList) {
        totalMax = 0;
        worstLen = 0;
        totalCount = 0;
        if (answerWord) {
            // just check the answer word
            if (answerWord !== guessWord) {
                const {maxDepth, totalSolutions} = findMaxDepth(guessWord, answerWord, wordlist.filter(w => w !== guessWord), existingFilter, 0, guessWord, 0);
                //console.log("total solutions from " + guessWord + " to " + answerWord + " = " + totalSolutions);
                worstLen = totalMax;
                totalMax = maxDepth;
                totalCount += totalSolutions;
            }

            console.log("==> Max depth for " + guessWord + " = " + totalMax.toString() + ", total paths = " + totalCount);
            newMatchMap[guessWord] = { frequency: totalMax, worst: totalMax, total: totalCount};
            if (totalMax < bestLen) {
                bestLen = totalMax;
                newMatchMap.bestWord = guessWord;
            }
        } else {
            // check the whole word list
            for (const baseWord of wordlist) {
                if (baseWord !== guessWord) {
                    console.log("Mapping from " + guessWord + " to " + baseWord + "...");
                    const {maxDepth, totalSolutions} = findMaxDepth(guessWord, baseWord, wordlist.filter(w => w !== guessWord), existingFilter, 0, guessWord, 0);
                    totalCount += totalSolutions;
                    totalMax += maxDepth;
                    if(maxDepth > worstLen) {
                        worstLen = maxDepth;
                    }

                }
            }

            averageLen = totalMax / wordList.length;
            console.log("==> Total average depth for " + guessWord + " = " + averageLen.toString() + ", total solutions = " + totalCount);
            newMatchMap[guessWord] = { frequency: averageLen, worst: worstLen, total: totalCount};
            if (averageLen < bestLen) {
                bestLen = averageLen;
                newMatchMap.bestWord = guessWord;
            }

            if (totalCount < bestCount) {
                bestCount = totalCount;
                newMatchMap.leastCount = guessWord;
            }
        }
    }
    console.log(newMatchMap);
    return newMatchMap;
}

const findMaxDepth = (guessWord, answerWord, searchList, curFilter, curDepth, history, solutionCount) => {
    let newDepth, curMaxDepth = 0, newSolutionCount = solutionCount;

    // score the word
    const newFilter = filterFromGuess(guessWord, answerWord, curFilter);
    const newWordList = filterWordList(newFilter, searchList);

    for (const testWord of newWordList) {
        const newHistory = history + " > " + testWord;
        if (testWord === answerWord) {
            newDepth = curDepth + 1;
            newSolutionCount++;
            console.log(newHistory);
        } else {
            const {maxDepth, totalSolutions} = findMaxDepth(testWord, answerWord, newWordList, newFilter, curDepth+1, newHistory, newSolutionCount);
            newSolutionCount = totalSolutions;
            newDepth = maxDepth;
        }

        if (newDepth > curMaxDepth) {
            curMaxDepth = newDepth;
        }


    }

    return {maxDepth: curMaxDepth, totalSolutions: newSolutionCount} ;
}


const filterWordList = (pattern, wordList) => {
    return wordList.filter( w => {
        let safe = true;

        // remove words that have invalid letters
        for (let curStop of pattern.cantHave) {
            if (w.indexOf(curStop) > -1) {
                safe = false;
                break;
            }
        }

        // remove words that don't have required letters
        for (let curGo of pattern.mustHave) {
            if (w.indexOf(curGo) === -1) {
                safe = false;
                break;
            }
        }

        // check for required letters
        for (let curLetter = 0; curLetter < 5; curLetter++) {
            const curPat = pattern.limit[curLetter];

            // if this must be a letter, remove it if it does not match
            if (curPat.mustBe && w[curLetter] !== curPat.mustBe) {
                safe = false;
                break;
            }

            // if this can't be a letter, remove it if it is
            for (let curStop of curPat.cantBe) {
                if (w[curLetter] === curStop) {
                    safe = false;
                    break;
                }
            }
        }

        return safe;
    });
}


const createEmptyFilter = () => {
    const emptyFilter = {
        cantHave: [],
        mustHave: [],
        limit: [
            {
                mustBe: null,
                cantBe: [],
            },
            {
                mustBe: null,
                cantBe: [],
            },
            {
                mustBe: null,
                cantBe: [],
            },
            {
                mustBe: null,
                cantBe: [],
            },
            {
                mustBe: null,
                cantBe: [],
            },
        ],
    };
    return emptyFilter;
}

const filterFromGuess = (guessWord, answerWord, curFilter) => {
    let score = scoreGuess(guessWord, answerWord) ;

    return updateFilterWithScore(guessWord, score, curFilter);
}

const scoreGuess = (guess, base) => {
    const tryGuess = guess.toLowerCase();
    const answerWord = base.toLowerCase();
    let score = "";

    for (let i = 0; i < 5; i++) {
        if (tryGuess[i] === answerWord[i]) {
            // a match!
            score += "2";
        } else if (answerWord.indexOf(tryGuess[i]) === -1) {
            // not in the word at all
            score += "0";
        } else {
            // in the word, but the wrong place
            score +=  "1";
        }
    }

    return score;
}

const updateFilterWithScore = (guess, score, oldFilter) => {
    let newFilter = JSON.parse(JSON.stringify(oldFilter));
    const tryGuess = guess.toLowerCase();

    for (let i = 0; i < 5; i++) {
        if (score[i] === "2") {
            // a match! - add to must have list
            if (newFilter.mustHave.find(e => e === tryGuess[i]) === undefined ) {
                newFilter.mustHave.push(tryGuess[i]);
            }

            // Make it the must be for this loc
            newFilter.limit[i].mustBe = tryGuess[i];

        } else if (score[i] === "0") {
            // not in the word at all - add to can't have list
            if (newFilter.cantHave.find(e => e === tryGuess[i]) === undefined ) {
                newFilter.cantHave.push(tryGuess[i]);
            }
        } else if (score[i] === "1") {
            // in the word, but the wrong place
            if (newFilter.mustHave.find(e => e === tryGuess[i]) === undefined ) {
                newFilter.mustHave.push(tryGuess[i]);
            }

            // add it to the can't have for this loc
            if (newFilter.limit[i].cantBe.find(e => e === tryGuess[i]) === undefined ) {
                newFilter.limit[i].cantBe.push(tryGuess[i]);
            }
        }
    }

    return newFilter;
}

const isEmptyFilter = filter => {
    if ((filter.cantHave.length === 0) &&
        (filter.mustHave.length === 0)) {
        for (let i = 0; i < 5; i++) {
            const {cantBe, mustBe} = filter.limit[i];
            if (!(cantBe.length === 0 && mustBe === null)) {
                return false;
            }
        }
        return true;
    } else {
        return false;
    }
}


function App() {
    const [miniFilter, setMiniFilter] = useState("33333");
    const [curGuess, setGuess] = useState("");
    const [baseWord, setBaseWord] = useState("");
    const [pattern, setPattern] = useState(createEmptyFilter());
    const [guesses, setGuesses] = useState([]);
    const [matchMap, setMatchMap] = useState({});

    let wordMatchList =  filterWordList(pattern, wordlist);


    useEffect(() => {
        updateScore();
    }, [guesses, pattern, baseWord])

    const handleWordClick = evt => {
        if (baseWord === "") {
            setBaseWord(evt.target.innerText);

        } else {
            setGuess(evt.target.innerText);
        }
        evt.stopPropagation();

    }

    const handleTextChange = event => {
        setGuess(event.target.value);
    }

    const clearBoard = () => {
        setGuess("");
        setGuesses([]);
        setPattern(createEmptyFilter());

    }

    const handleClearBase = () => {
        setBaseWord("");
        clearBoard();
    }

    const handleSetBase = () => {
        setBaseWord(wordlist[Math.floor(Math.random() * wordlist.length)]);
        clearBoard();
    }

    const handleKeyDown = event => {
        if (event.keyCode === 13) {
            handleAddGuess(event);
        }
    }

    const handleAddGuess = () => {
        let score = baseWord !== "" ? scoreGuess(curGuess, baseWord) : miniFilter;
        let newPattern = updateFilterWithScore(curGuess, score, pattern);

        console.log("base: " + baseWord + ", guess:" + curGuess + ", score:" + score);

        // add the guess to the history
        const newGuess = {
            word: curGuess,
            score: score,
        };

        setGuesses(guesses.concat(newGuess));
        setGuess("");
        setMiniFilter("33333");
        setPattern(newPattern);
    }

    const updateScore = () => {
        // test
        console.log("MatchList Count:" + wordMatchList.length + ", baseWord: " + baseWord);
        //let newMatchMap = scoreWordList(wordMatchList, baseWord.toLowerCase(), pattern);
        let newMatchMap = fastScoreWordList(wordMatchList, baseWord.toLowerCase(), pattern);

        setMatchMap(newMatchMap);


    }

    const handleTileClick = evt => {
        const index = parseInt(evt.target.getAttribute("data-index"));
        let curChar = miniFilter[index];
        let newChar = curChar;

        if (curChar === "0") {
            newChar = "1";
        } else if (curChar === "1") {
            newChar = "2";
        } else if (curChar === "2") {
            newChar = "3";
        } else if (curChar === "3") {
            newChar = "0";
        }

        const newFilter = miniFilter.substring(0,index) + newChar + miniFilter.substring(index+1);
        console.log(index + ": " + miniFilter + " => " + newFilter);

        setMiniFilter(newFilter);

    }

    return (
        <div className="App">

            <div>
                <button onClick={handleSetBase}>Chose base</button>
                <button onClick={handleClearBase}>Clear base</button>
                {
                    baseWord !== "" ?
                        (
                            <div className="UIText">{baseWord}</div>
                        ) :
                        (
                            <div className="UIText">Base word not set!</div>
                        )
                }
            </div>
            <div>
                <span className="UIText">guess:</span>
                <input type="text" onChange={handleTextChange} value={curGuess} onKeyUp={handleKeyDown} />
                <button onClick={handleAddGuess}>Guess!</button>
            </div>
            <WordGuess guesses={guesses} curGuess={curGuess} miniFilter={miniFilter} handleTileClick={handleTileClick} />


            <MatchList wordMatchList={wordMatchList} answer={baseWord.toLowerCase()} handleWordClick={handleWordClick} frequencyMap={matchMap} />
        </div>
    );
}

export default App;
