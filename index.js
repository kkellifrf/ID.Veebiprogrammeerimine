require("dotenv").config();
const express = require('express');
const dateTimeET = require("./src/dateTimeET");
const fs = require('fs');
const db = require("./database");

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
// Eesti filmide veebileht
// Eesti filmimaailma avaleht
app.get("/eestifilm", (req, res) => {
    res.send(`
        <h1>Eesti filmimaailm</h1>
        <p>Tere tulemast Eesti filmimaailma!</p>

        <h2>Isikud</h2>
        <a href="/eestifilm/isikud">Vaata filmidega seotud isikuid</a>
        <br>
        <a href="/eestifilm/lisa">Lisa uus isik</a>

        <h2>Ametid</h2>
        <a href="/eestifilm/amet/lisa">Lisa uus amet</a>

        <h2>Žanrid</h2>
        <a href="/eestifilm/zanr/lisa">Lisa uus filmižanr</a>
    `);
});
// Eesti filmidega seotud isikute nimekiri
app.get("/eestifilm/isikud", async (req, res) => {
    try {
        const [isikud] = await db.query(
            "SELECT id, first_name, last_name, born, deceased FROM person ORDER BY last_name, first_name"
        );

        res.render("eestifilm_isikud", { isikud: isikud });
    } catch (error) {
        console.error("Andmebaasi viga:", error.message);
        res.status(500).send("Isikute nimekirja laadimine ebaõnnestus.");
    }
});
// Uue isiku lisamise vormi kuvamine
app.get("/eestifilm/lisa", (req, res) => {
    res.render("eestifilm_lisa", {
        first_name: null,
        last_name: null,
        born: null,
        deceased: null,
        error: null
    });
});
// Uue isiku andmete vastuvõtmine ja salvestamine
app.post("/eestifilm/lisa", async (req, res) => {
    const { first_name, last_name, born, deceased } = req.body;

    // Sisestatud andmed, mille saadame vajadusel vormile tagasi
    const formData = {
        first_name,
        last_name,
        born,
        deceased
    };

    // Veateate korral kuvatakse vorm koos sisestatud andmetega
    const showError = (message) => {
        return res.status(400).render("eestifilm_lisa", {
            ...formData,
            error: message
        });
    };

    // Kohustuslike väljade kontroll
    if (!first_name?.trim()) {
        return showError("Palun sisesta eesnimi!");
    }

    if (!last_name?.trim()) {
        return showError("Palun sisesta perekonnanimi!");
    }

    if (!born) {
        return showError("Palun sisesta sünnikuupäev!");
    }

    // Nime pikkuse kontroll
    if (first_name.trim().length > 100 ||
        last_name.trim().length > 100) {
        return showError("Ees- või perekonnanimi on liiga pikk!");
    }

    // Kuupäeva kehtivuse kontroll
    const validDate = (value) => {
        if (typeof value !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return false;
        }

        const date = new Date(value + "T00:00:00Z");

        return !Number.isNaN(date.getTime()) &&
            date.toISOString().slice(0, 10) === value;
    };

    if (!validDate(born)) {
        return showError("Sünnikuupäev ei ole korrektne!");
    }

    // Tulevikus oleva sünnikuupäeva kontroll
    const today = new Date().toISOString().slice(0, 10);

    if (born > today) {
        return showError("Sünnikuupäev ei tohi olla tulevikus!");
    }

    // Surmakuupäeva kontroll, kui see on sisestatud
    if (deceased) {
        if (!validDate(deceased)) {
            return showError("Surmakuupäev ei ole korrektne!");
        }

        if (deceased > today) {
            return showError("Surmakuupäev ei tohi olla tulevikus!");
        }

        if (deceased < born) {
            return showError(
                "Surmakuupäev ei tohi olla sünnikuupäevast varasem!"
            );
        }
    }

    // Andmete salvestamine MariaDB andmebaasi
    try {
        await db.execute(
            `INSERT INTO person
             (first_name, last_name, born, deceased)
             VALUES (?, ?, ?, ?)`,
            [
                first_name.trim(),
                last_name.trim(),
                born,
                deceased || null
            ]
        );

        res.redirect("/eestifilm/isikud");

    } catch (error) {
        console.error("Isiku lisamise viga:", error.message);

        res.status(500).render("eestifilm_lisa", {
            ...formData,
            error: "Isiku salvestamine ebaõnnestus."
        });
    }
});
// Uue ameti lisamise vormi kuvamine
app.get("/eestifilm/amet/lisa", (req, res) => {
    res.render("eestifilm_amet_lisa", {
        title: "",
        description: "",
        error: null
    });
});

// Uue ameti andmete vastuvõtmine ja salvestamine
app.post("/eestifilm/amet/lisa", async (req, res) => {
    const { title, description } = req.body;

    const showError = (message, status = 400) => {
        return res.status(status).render("eestifilm_amet_lisa", {
            title: title ?? "",
            description: description ?? "",
            error: message
        });
    };

    // Sisestatud andmete kontrollimine
    if (typeof title !== "string" || !title.trim()) {
        return showError("Palun sisesta ameti nimetus!");
    }

    if (title.trim().length > 50) {
        return showError("Ameti nimetus võib olla kuni 50 tähemärki!");
    }

    if (typeof description !== "string") {
        return showError("Ameti kirjeldus ei ole korrektne!");
    }

    if (description.trim().length > 1000) {
        return showError("Kirjeldus võib olla kuni 1000 tähemärki!");
    }

    // Andmete salvestamine MariaDB-sse
    try {
        await db.execute(
            `INSERT INTO profession (title, description)
             VALUES (?, ?)`,
            [
                title.trim(),
                description.trim() || null
            ]
        );

        res.redirect("/eestifilm");

    } catch (error) {
        console.error("Ameti lisamise viga:", error.message);
        return showError("Ameti salvestamine ebaõnnestus.", 500);
    }
});
// Uue filmižanri lisamise vormi kuvamine
app.get("/eestifilm/zanr/lisa", (req, res) => {
    res.render("eestifilm_zanr_lisa", {
        name: "",
        description: "",
        error: null
    });
});

// Uue filmižanri andmete vastuvõtmine ja salvestamine
app.post("/eestifilm/zanr/lisa", async (req, res) => {
    const { name, description } = req.body;

    // Veateate korral kuvatakse vorm koos sisestatud andmetega
    const showError = (message, status = 400) => {
        return res.status(status).render("eestifilm_zanr_lisa", {
            name: name ?? "",
            description: description ?? "",
            error: message
        });
    };

    // Žanri nimetuse kontrollimine
    if (typeof name !== "string" || !name.trim()) {
        return showError("Palun sisesta žanri nimetus!");
    }

    if (name.trim().length > 50) {
        return showError("Žanri nimetus võib olla kuni 50 tähemärki!");
    }

    // Kirjelduse kontrollimine
    if (typeof description !== "string") {
        return showError("Žanri kirjeldus ei ole korrektne!");
    }

    if (description.trim().length > 1000) {
        return showError("Kirjeldus võib olla kuni 1000 tähemärki!");
    }

    // Andmete salvestamine MariaDB andmebaasi
    try {
        await db.execute(
            `INSERT INTO genre (name, description)
             VALUES (?, ?)`,
            [
                name.trim(),
                description.trim() || null
            ]
        );

        res.redirect("/eestifilm");

    } catch (error) {
        console.error("Žanri lisamise viga:", error.message);
        return showError("Žanri salvestamine ebaõnnestus.", 500);
    }
});

app.listen(5217);