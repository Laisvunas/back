const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();

const {mysqlConfig, jwtSecret} = require("../config");
const { isLoggedIn } = require('../middleware/middleware');

router.post("/all", async (req, res) => {
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

router.post("/publish", isLoggedIn, async (req, res) => {
    if (!req.body.author_id || !req.body.title || !req.body.sentence || !req.body.code) {
        return res.status(400).send({error: "Insufficient data provided"});
    }

    try {
        const con = await mysql.createConnection(mysqlConfig);

        // case Publish
        if (!req.body.id) {
            const [data] = await con.execute(`INSERT INTO diagrams (user_id, title, sentence, code, commentary ${req.body.editor == 'y' ? ', editors_commentary' : ''}) VALUES (${mysql.escape(req.body.author_id)}, ${mysql.escape(req.body.title)}, ${mysql.escape(req.body.sentence)}, ${mysql.escape(req.body.code)}, ${mysql.escape(req.body.commentary)}) ${req.body.editor == 'y' ? mysql.escape(req.body.editors_commentary) : ''}`);
            
            if (data.affectedRows !== 1) {
                return res.status(500).send({error: "Error in DB"});
            }

            return res.send({data, msg: "The diagram has been successfully saved."});
        }
        // case Edit
        else {
            const [data] = await con.execute(`UPDATE diagrams SET title = ${mysql.escape(req.body.title)}, sentence = ${mysql.escape(req.body.sentence)}, code = ${mysql.escape(req.body.code)}, commentary = ${mysql.escape(req.body.commentary)} ${req.body.editor == 'y' ? ', editors_commentary = ' + mysql.escape(req.body.editors_commentary) : ''} WHERE id = ${mysql.escape(req.body.id)}`);

            console.log("data: " + JSON.stringify(data));

            return res.send({data, msg: "The diagram has been successfully updated."});
        }

        con.end();

    }
    catch(e) {
        console.log(e);
        res.status(500).send({ error: "DB error"});
    }
});

module.exports = router;