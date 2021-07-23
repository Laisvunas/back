const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();

const {mysqlConfig, jwtSecret} = require("../config");
const { isLoggedIn } = require('../middleware/middleware');

router.post("/all", async (req, res) => {
    if (!req.body.author_id) {
        return res.status(400).send({error: "Insufficient data provided"});
    }

    try {
        const returnObj = {};
        const con = await mysql.createConnection(mysqlConfig);
        const [data] = await con.execute(`SELECT id, title, sentence, commentary, editors_commentary, created FROM diagrams WHERE user_id = ${mysql.escape(req.body.author_id)} ORDER BY created DESC`);
        returnObj.loggedUserDiagrams = data;


        const [data2] = await con.execute(`SELECT diagrams.id, diagrams.title, diagrams.sentence, diagrams.commentary, diagrams.editors_commentary, diagrams.created, authors.username FROM diagrams INNER JOIN authors ON diagrams.user_id = authors.id WHERE diagrams.user_id != ${mysql.escape(req.body.author_id)} ORDER BY authors.username ASC, diagrams.created DESC`);
        returnObj.otherUsersDiagrams = data2;


        con.end();

        return res.send(returnObj);
    }
    catch(e) {
        console.log(e);
        res.status(500).send({ error: "DB error"});
    }
});

router.post("/publish", isLoggedIn, async (req, res) => {
    if (!req.body.author_id || !req.body.editor || !req.body.title || !req.body.sentence || !req.body.code) {
        return res.status(400).send({error: "Insufficient data provided"});
    }

    try {
        const con = await mysql.createConnection(mysqlConfig);

        let sql = '';
        let data = [];

        // case Publish
        if (!req.body.id) {
            sql = `INSERT INTO diagrams (user_id, title, sentence, code, commentary ${req.body.editor == 'y' ? ', editors_commentary' : ''}) VALUES (${mysql.escape(req.body.author_id)}, ${mysql.escape(req.body.title)}, ${mysql.escape(req.body.sentence)}, ${mysql.escape(req.body.code)}, ${mysql.escape(req.body.commentary)} ${req.body.editor == 'y' ? ', ' + mysql.escape(req.body.editors_commentary) : ''})`;
            [data] = await con.execute(sql);
            con.end();
            
            if (data.affectedRows !== 1) {
                return res.status(500).send({error: "Error in DB"});
            }

            return res.send({data, msg: "The diagram has been successfully saved."});
        }
        // case Edit
        else {
            // not editor can edit only his own diagram
            if (req.body.editor !== 'y') {
                sql = `SELECT * FROM diagrams WHERE user_id = ${mysql.escape(req.body.author_id)} AND id = ${mysql.escape(req.body.id)}`;
                [data] = await con.execute(sql);
                if (data.length !== 1) {
                    con.end();
                    return res.status(400).send({error: "You are not authorized to perform this action."});
                }
            }
            
            sql = `UPDATE diagrams SET title = ${mysql.escape(req.body.title)}, sentence = ${mysql.escape(req.body.sentence)}, code = ${mysql.escape(req.body.code)}, commentary = ${mysql.escape(req.body.commentary)} ${req.body.editor == 'y' ? ', editors_commentary = ' + mysql.escape(req.body.editors_commentary) : ''} WHERE id = ${mysql.escape(req.body.id)}`;
            [data] = await con.execute(sql);
            con.end();

            if (data.affectedRows !== 1) {
                return res.status(500).send({error: "Error in DB."});
            }

            return res.send({data, msg: "The diagram has been successfully updated."});
        }

    }
    catch(e) {
        console.log(e);
        res.status(500).send({ error: "DB error."});
    }
});

router.post("/publish/:id", isLoggedIn, async (req, res) => {
    try {
        const con = await mysql.createConnection(mysqlConfig);
        const sql = `SELECT diagrams.id, diagrams.user_id, diagrams.title, diagrams.sentence, diagrams.code, diagrams.commentary, diagrams.editors_commentary, diagrams.created, authors.username FROM diagrams INNER JOIN authors ON diagrams.user_id = authors.id WHERE diagrams.id = ${mysql.escape(req.params.id)}`;
        const [data] = await con.execute(sql);
        con.end();

        if (data.length == 0) {
            return res.send({ error: "Diagram not found."});
        }

        return res.send({data});
    }
    catch(e) {
        console.log(e);
        res.status(500).send({ error: "DB error."});
    }
});

router.post("/delete/:id", isLoggedIn, async (req, res) => {
    if (!req.body.author_id || !req.body.editor) {
        return res.status(400).send({error: "Insufficient data provided"});
    }

    try {
        const con = await mysql.createConnection(mysqlConfig);

        let sql = '';
        let data = [];

        // not editor can delete only his own diagram
        if (req.body.editor !== 'y') {
            sql = `SELECT * FROM diagrams WHERE user_id = ${mysql.escape(req.body.author_id)} AND id = ${mysql.escape(req.params.id)}`;
            [data] = await con.execute(sql);
            if (data.length !== 1) {
                con.end();
                return res.status(400).send({error: "You are not authorized to perform this action."});
            }
        }

        sql = `DELETE FROM diagrams WHERE id = ${mysql.escape(req.params.id)}`;
        [data] = await con.execute(sql);

        if (data.affectedRows !== 1) {
            return res.status(500).send({error: "Error in DB."});
        }

        return res.send({ data, msg: "Diagram has been successfully deleted."});
    }
    catch(e) {
        console.log(e);
        res.status(500).send({ error: "Error in DB."});
    }
});

router.post("/view", isLoggedIn, async (req, res) => {
    if (!req.body.id) {
        return res.status(400).send({error: "Insufficient data provided"});
    }

    try {
        const con = await mysql.createConnection(mysqlConfig);

        let sql = `SELECT diagrams.id, diagrams.user_id, diagrams.title, diagrams.sentence, diagrams.code, diagrams.commentary, diagrams.editors_commentary, diagrams.created, authors.username FROM diagrams INNER JOIN authors ON diagrams.user_id = authors.id WHERE diagrams.id = ${mysql.escape(req.body.id)}`;
        [data] = await con.execute(sql);
        con.end();

        if (data.length !== 1) {
            return res.status(400).send({error: "Diagram not found."});
        }

        return res.send({ data });

    }
    catch(e) {
        console.log(e);
        res.status(500).send({ error: "Error in DB."});
    }
});

module.exports = router;