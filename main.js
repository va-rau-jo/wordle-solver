const {Builder, By, Key, until} = require('selenium-webdriver');

const BROWSER = 'chrome';
const FIRST_GUESS = 'alien';
const WORDLE_URL = 'https://octokatherine.github.io/word-master/';

let rowNum = 0;

(async function main() {
  let driver = await new Builder().forBrowser(BROWSER).build();
  try {
    await driver.get(WORDLE_URL);
    await skipHowToPlay(driver);
    let result = await makeGuess(driver, FIRST_GUESS);
    // await driver.findElement(By.name('q')).sendKeys('webdriver', Key.RETURN);
    // await driver.wait(until.titleIs('webdriver - Google Search'), 1000);
  } catch (e) {
      console.log(e);
  } finally {
      setTimeout(async () => {
        await driver.quit();
      }, 1000);
  }
})();

async function makeGuess(driver, guess) {
    let element = driver.switchTo().activeElement();
    // Individually sends keys so browser keeps up.
    for (let i = 0; i < guess.length; i++) {
        await element.sendKeys(guess[i]);
    }
    element.sendKeys(Key.RETURN);
    try {
        let firstRowGuess = await driver.findElement(By.css('.grid > span:nth-child(' + rowNum * 5 + 1));
        let clazz = await firstRowGuess.getAttribute("class");
        console.log(clazz);
    } catch (e) {
        console.log(e);
    }
        rowNum++;
}
 

// Skips how to play by clicking on x button
async function skipHowToPlay(driver) {
    try {
        await driver.findElement(By.css('button.absolute')).click();  
    } catch (_) { }
}