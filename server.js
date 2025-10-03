// express - server yaratish
const express = require("express");
// db.json faylida ma’lumotlarni o‘qish va yozish uchun
const fs = require("fs");
// frontend va backend portlarda ishlaganda, ular o‘zaro gaplasha olishi uchun ishlatiladigan middleware
const cors = require("cors");
app.use(cors());


// (asosiy server obyekt).
const app = express();
// serverni qaysi portda ishga tushirishni belgilaydi
const port = process.env.PORT || 3000;


const allowedOrigins = [
  "http://localhost:4200",
  "https://miniapp-frontend.netlify.app"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS blocked for this origin: " + origin));
    }
  },
  methods: "GET,POST,PUT,DELETE",
  credentials: true
};

app.use(cors(corsOptions));
// req.body orqali JSON ma’lumotlarini o‘qiy oladi.
app.use(express.json());


// GET Barcha ma’lumotlarni olish
app.get("/clothes", (req, res) => {
  // request -> so'rov, response -> javob
  const page = parseInt(req.query.page) || 0;
  const perPage = parseInt(req.query.perPage) || 10;

  fs.readFile("db.json", "utf8", (err, data) => {
    // utf8 - matnni UTF-8 kodlashda o‘qiydi.
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
      return;
    }
    // Data ni JSON ga aylantirish
    const jsonData = JSON.parse(data);

    //  gacha elementlar olinadi.
    const start = page * perPage;
    const end = start + perPage;

    // Slice metodi orqali kesib olish
    const result = jsonData.items.slice(start, end);

    // Javob qaytarish
    res.status(200).json({
      items: result,
      total: jsonData.items.length, // elementlar uzunligi
      page, // sahifa raqami
      perPage, // elementlar soni
      totalPages: Math.ceil(jsonData.items.length / perPage), // umumiy soni
    });
  });
});


// POST add ma’lumot qo‘shish
app.post("/clothes", (req, res) => {
  // image  - rasm linki
  // name   - kiyim nomi
  // price  - narxi
  // rating - bahosi
  const { image, name, price, rating } = req.body;

  // db faylini o‘qish uchun
  fs.readFile("db.json", "utf8", (err, data) => {
    // utf8 - string ko‘rinishida o‘qish uchun
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
      return;
    }

    const jsonData = JSON.parse(data);

    const maxId = jsonData.items.reduce(
      (max, item) => Math.max(max, item.id),
      0
    );

    // Yangi item obyekt taratilishi
    const newItem = {
      id: maxId + 1,
      image,
      name,
      price,
      rating,
    };

    // massiviga yangi item qo'shilish jarayoni.
    jsonData.items.push(newItem); // push metodi oxiridan qo‘shadi


    // bu yerda yangi qo'shilgan item db.json faylga yoziladi qo'shib qo'yiladi
    fs.writeFile("db.json", JSON.stringify(jsonData), (err) => {
      if (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
        return;
      }
      // 201 Created status kodini qaytaradi.
      res.status(201).json(newItem);
    });
  });
});


// PUT edit ma’lumotni o'zgartirish va yangilash
app.put("/clothes/:id", (req, res) => {
  // :id - dinamik parametr (qaysi elementni yangilash kerakligini bildiradi)

  const id = parseInt(req.params.id); // URL ichida :id joyidan kelgan qiymatni oladi.
  const { image, name, price, rating } = req.body;

  // db.json faylini string ko‘rinishda o‘qish
  fs.readFile("db.json", "utf8", (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
      return;
    }

    // db.json stringni obyektga (jsonData) aylantirish.
    const jsonData = JSON.parse(data);

    // items ichidan qaysi item yangilanishi kerakligini topamiz.
    const index = jsonData.items.findIndex((item) => item.id === id);

    if (index === -1) {
      res.status(404).send("Not Found");
      return;
    }

    // Agar item topilgan bo‘lsa eski item o‘rniga yangi obyekt yozib qo‘yiladi
    // id o‘zgarishsiz qoladi, qolgan qiymatlar esa req.body dan olinadi.
    jsonData.items[index] = {
      id,
      image,
      name,
      price,
      rating,
    };

    // Yangilangan jsonData ni qaytadan db.json fayliga yozib qo'yilish jarayoni
    fs.writeFile("db.json", JSON.stringify(jsonData), (err) => {
      if (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
        return;
      }
      // yangilangan item JSON farmatda qaytadi.
      res.status(200).json(jsonData.items[index]);
    });
  });
});


// DELETE - ma’lumotni o‘chirish
app.delete("/clothes/:id", (req, res) => {
  // :id - dinamik parametr, qaysi elementni o‘chirish kerakligini bildiradi.

  const id = parseInt(req.params.id);

  fs.readFile("db.json", "utf8", (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
      return;
    }

    const jsonData = JSON.parse(data);

    const index = jsonData.items.findIndex((item) => item.id === id);

    if (index === -1) {
      res.status(404).send("Not Found");
      return;
    }

    // splice orqali massivdan o'chirish
    jsonData.items.splice(index, 1);

    fs.writeFile("db.json", JSON.stringify(jsonData), (err) => {
      if (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
        return;
      }

      res.status(204).send();
    });
  });
});



// localhost:3000 - serverni ishga tushirish.
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
