const express = require('express');
const dateTimeET = require("./src/dateTimeET");
const fs = require('fs');

//käivitan funktsiooni express() ja annan nimeks app
const app = express();
//määrame renderdusmootori: EJS
app.set('view engine', 'ejs');
app.use(express.static('public'));


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


app.listen(5217);