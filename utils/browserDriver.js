const { Builder, By } = require('selenium-webdriver');

const BROWSER = 'chrome';
const WORDLE_URL = 'https://octokatherine.github.io/word-master/';

const MODAL_CLOSE_BUTTON_SELECTOR = 'button.absolute';
const MODAL_OPEN_SELECTOR = 'body.ReactModal__Body--open';
const PLAY_AGAIN_BUTTON_SELECTOR = '.ReactModal__Overlay button.rounded-lg';
const SUCCESS_SELECTOR = '.ReactModal__Overlay h1';

function BrowserDriver() {}

// Initializes the BrowserDriver by building for our specified broswer
// and fetching the Wordle website.
BrowserDriver.prototype.init = async function () {
    this.driver = await new Builder().forBrowser(BROWSER).build();
    await this.driver.get(WORDLE_URL);
};

// Clicks the play again button
BrowserDriver.prototype.clickPlayAgain = async function () {
    await this.driver.findElement(By.css(PLAY_AGAIN_BUTTON_SELECTOR)).click();
};

// Switches to the active element (needed for typing into the browser)
BrowserDriver.prototype.getActiveElement = async function () {
    return this.driver.switchTo().activeElement();
};

// Returns the letter element of a particular row.
// Index 0 is the first letter, index 1 is the second letter,
// index 5 is the first letter of the second row.
BrowserDriver.prototype.getLetterByIndex = async function (index) {
    try {
        return await this.driver.findElement(By.css('.grid > span:nth-child(' + index + ')'));
    } catch (e) {
        console.log(e);
    }
};

// Returns true if the game is over (play again button is visible)
BrowserDriver.prototype.isGameOver = async function () {
    try {
        await this.driver.findElement(By.css(MODAL_OPEN_SELECTOR));
        return true;
    } catch (_) {
        return false;
    }
};

// Returns true if the word was correct
BrowserDriver.prototype.isWordCorrect = async function () {
    try {
        let element = await this.driver.findElement(By.css(SUCCESS_SELECTOR));
        return (await element.getAttribute('textContent')).includes('Congrats!');
    } catch (_) {}
};

// Closes the browser
BrowserDriver.prototype.quit = async function () {
    await this.driver.quit();
};

// Skips how to play by clicking on x button.
// Does nothing if there is no x button to click.
BrowserDriver.prototype.skipHowToPlay = async function () {
    try {
        await this.driver.findElement(By.css(MODAL_CLOSE_BUTTON_SELECTOR)).click();
    } catch (e) {
        console.log(e);
    }
};

module.exports = BrowserDriver;
