const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();

const {mysqlConfig, jwtSecret} = require("../config");

router.post("/all", async (req, res) => {
    console.log("req.body: " + JSON.stringify(req.body));
    if (!req.body.author_id || !req.body.isEditor ) {
        return res.status(400).send({error: "Insufficient data provided"});
    }

    try {
        const returnObj = {};
        const con = await mysql.createConnection(mysqlConfig);
        const [data] = await con.execute(`SELECT id, title, sentence, commentary, editors_commentary, created FROM diagrams WHERE user_id = ${mysql.escape(req.body.author_id)} ORDER BY created DESC`);
        returnObj.loggedUserDiagrams = data;

        if (req.body.isEditor === 'y') {
            const [data2] = await con.execute(`SELECT diagrams.id, diagrams.title, diagrams.sentence, diagrams.commentary, diagrams.editors_commentary, diagrams.created, authors.username FROM diagrams INNER JOIN authors ON diagrams.user_id = authors.id WHERE diagrams.user_id != ${mysql.escape(req.body.author_id)} ORDER BY created DESC`);
            returnObj.otherUsersDiagrams = data2;
        }

        con.end();

        return res.send(returnObj);
    }
    catch(e) {
        console.log(e);
        res.status(500).send({ error: "DB error"});
    }
});

module.exports = router;