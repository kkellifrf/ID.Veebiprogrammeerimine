const dateFormattedET = function (monthType){
    let timeNow = new Date();

    let dateNow = timeNow.getDate();
    let monthNow = timeNow.getMonth();
    let yearNow = timeNow.getFullYear();

    const MonthNameET = [
        "jaanuar",
        "veebruar",
        "märts",
        "aprill",
        "mai",
        "juuni",
        "juuli",
        "august",
        "september",
        "oktoober",
        "november",
        "detsember"
    ];
    const folkMonthNameET = [
        "näärikuu",
        "küünlakuu",
        "paastukuu",
        "jürikuu",
        "lehekuu",
        "jaanikuu",
        "heinakuu",
        "lõikuskuu",
        "mihklikuu",
        "viinakuu",
        "talvekuu",
        "jõulukuu"
    ];
    if (monthType == 1){
        return dateNow + ". " + MonthNameET[monthNow] + " (" + folkMonthNameET[monthNow] + ") " + yearNow;
    } else {
        return dateNow + "." + MonthNameET[monthNow] + " " + yearNow;
    }

}
const timeFormattedET = function(){
//function timeFormattedET() {
    let timeNow = new Date();

    let hourNow = timeNow.getHours();
    let minuteNow = timeNow.getMinutes();
    let secondNow = timeNow.getSeconds();

    if (hourNow < 10) {
        hourNow = "0" + hourNow;
    }

    if (minuteNow < 10) {
        minuteNow = "0" + minuteNow;
    }

    if (secondNow < 10) {
        secondNow = "0" + secondNow;
    }

    return hourNow + ":" + minuteNow + ":" + secondNow;
}
const weekDayET = function (){
    let timeNow = new Date();
    let dayNow = timeNow.getDay();
    const dayNameET = [
        "pühaoäev",
        "esmaspäev",
        "teisipäev",
        "kolmapäev",
        "neljapäev",
        "reede",
        "laupäev"
    ];
    return dayNameET[dayNow];
}

//ekspordin kõik vajalikud funktsioonid koos mugavamate nimedega
module.exports = {time: timeFormattedET, date: dateFormattedET, week: weekDayET};