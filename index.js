const express = require('express');
const dateTimeET = require("./src/dateTimeET");
const fs = require('fs');

//käivitan funktsiooni express() ja annan nimeks app
const app = express();
//määrame renderdusmootori: EJS
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));


//marsuudid
app.get('/', (req, res)=>{
	//res.send('Express.js veeb läkski käima!');
	const dayNow = dateTimeET.week();
	const dateNow = dateTimeET.date();
	const timeNow = dateTimeET.time();
	res.render('index',{dayNow: dayNow, dateNow: dateNow, timeNow: timeNow});
});

app.get('/vanasona', (req, res) => {
    const tekst = fs.readFileSync('./public/txt/vanasonad.txt', 'utf8');
    const vanasonad = tekst.split(';')
    const juhuslik = vanasonad[Math.floor(Math.random() * vanasonad.length)];

    res.render('vanasona', {
        vanasona: juhuslik
    });
});
app.get("/minust", (req, res) => {
    res.render("minust");
});
app.get("/visit", (req, res) => {
    res.render("visit");
});
app.post("/visit", (req, res) => {
    const name = req.body.name;

    const now = new Date();
    const date = now.toLocaleDateString("et-EE");
    const time = now.toLocaleTimeString("et-EE");

    const visit = name + "," + date + "," + time + ";";

    fs.appendFile("visits.txt", visit, (err) => {
        if (err) {
            console.log(err);
            return res.send("Salvestamisel tekkis viga.");
        }

        res.redirect("/");
    });
});
app.get("/lastvisit", (req, res) => {
    fs.readFile("visits.txt", "utf8", (err, data) => {
        if (err) {
            return res.send("Külastusi ei ole veel registreeritud.");
        }

        const visits = data.split(";");
        const lastVisit = visits[visits.length - 2];

        const parts = lastVisit.split(",");

        const name = parts[0];
        const date = parts[1];
        const time = parts[2];

        res.send(
            "Viimati registreeriti külastus " +
            date +
            ", kell " +
            time +
            ", seda tegi " +
            name +
            "."
        );
    });
});

app.listen(5217);