
connectDB = (sql) => {
    return db = new sql.Database('policlinic.db', sql.OPEN_READWRITE | sql.OPEN_CREATE, (err) => {
        if (err) {
            console.log(err.message)
        } else {
            //console.log('Connected to the chinook database.')
            
        }            
    })
}

module.exports = function(app, sql) {
    app.get('/db/create', (req, res) => {
        let db = connectDB(sql)
    })

    app.post('/db/tablecreate', (req, res) => {
        res.header('Access-Control-Allow-Origin', '*')
        let db = connectDB(sql)

        console.log('body', Object.keys(req.body))
        let tableOptions = {
            'name' : req.body.tableName,
            'fields' : req.body.tableFields
        }

        console.log('option', tableOptions)
        //let body = JSON.parse(req.body)
        let resRows = []
        let dataType = ""

        tableOptions.fields.forEach((key, index) => {
            dataType += key.name + ' '
            dataType += key.type + ' '
            dataType += key.option.NOT_NULL.need ? 'NOT NULL ' : ''
            dataType += key.option.UNIQUE.need ? 'UNIQUE ' : ''
            dataType += key.option.PRIMARY_KEY.need ? 'PRIMARY KEY ' : ''
            dataType += key.option.DEFAULT.need ? `DEFAULT ${key.option.DEFAULT.value} ` : ''
            dataType += ((index != tableOptions.fields.length - 1) ? ', ' : '')
        })

        console.log(`CREATE TABLE ${tableOptions.name}(${dataType})`)
        db.serialize(() => {
            db.run(`CREATE TABLE ${tableOptions.name}(${dataType})`, (err) => {
                if (err) {

                    console.log("req", dataType)
                    console.log('create table',err.message)
                    return res.send(err.message)
                }
            })
        })

        db.close((err)=> {
            if (err) {
                console.log(err.message)
                res.send(err)
            } else {
                console.log(resRows)
                res.send(resRows) 
            }
        })        
    })

    app.get('/db/tableschema/:tablename', (req, res) => {
        res.header('Access-Control-Allow-Origin', '*')
        let db = connectDB(sql)
        
        db.serialize(() => {
            db.all(`pragma table_info(${req.params.tablename})`, (err, rows) => {
                if (err) {
                    res.send(err.message)
                } else {
                    console.log('rows:', rows)
                    res.send(rows)
                }
            })
        })        
    })

    app.get('/db/viewtable/:tablename', (req, res) => {
        res.header('Access-Control-Allow-Origin', '*')
        let db = connectDB(sql)

        db.serialize(() => {
            db.all(`SELECT rowid, * FROM ${req.params.tablename}`, (err, rows) => {
                if (err) {
                    res.send(err.message)
                } else {
                    console.log('rows view', rows)
                    res.send(rows)
                }
            })
        })
    })

    app.get('/db/tablelist/', (req, res) => {
        res.header('Access-Control-Allow-Origin', '*')
        let db = connectDB(sql)

        db.all(`SELECT name FROM sqlite_master WHERE type ='table'`, (err, rows) => {
            if (err) {
                console.log(err)
                res.send(err.message)
                return 1
            } else {
                console.log(rows)
                res.send(rows)
            }
        })
    })

    app.post('/db/tableinsert/:tablename', (req, res) => {
        res.header('Access-Control-Allow-Origin', '*')
        let db = connectDB(sql)
        console.log(req.body)
        let values = "("
        let cols = ""
        let sings = ""

        Object.keys(req.body.values).forEach((item, index) =>  {
            if (item != "undefined") {
                cols += (index > 0) ? ` ${item}` : `${item}`
                cols += (index < Object.keys(req.body.values).length - 1) ? ',' : ''
                console.log(item)

                values += `"${req.body.values[item]}"`
                values += (index < Object.keys(req.body.values).length - 1) ? ',' : ')'
            }
        })
        console.log(values)
        console.log('cols:', cols)
        console.log(sings)
        let string =  `INSERT INTO ${req.params.tablename}(${cols}) VALUES${values}`
        console.log('sql:', string)
        db.serialize(() => {
            db.run(`INSERT INTO ${req.params.tablename}(${cols}) VALUES${values}`, err => {
                if (err) {
                    console.log('err', err.message)
                    res.send(err.message)                    
                } else {
                    console.log('insert into table suc')
                    res.sendStatus(200)
                }   
            })
        })
    })

    app.post('/db/tabledelete', (req, res) => {        
        res.header('Access-Control-Allow-Origin', '*')
        let db = connectDB(sql)
        let error = []
        db.serialize(() => {
            req.body.forEach(item => {
                db.run(`DROP TABLE ${item}`, err => {
                    if (err) {
                        console.log(err.message)
                        error.push(err.message)
                    }
                }) 
            })
        })
        if (error.length > 0) {
            res.status(400).send(error)
        } else {
            res.send('OK')
        }
    })

    app.post('/db/customreq', (req, res) => {
        res.header('Access-Control-Allow-Origin', '*')
        let db = connectDB(sql)
        let error = []
        console.log('body:', Object.keys(req.body)[0])

        db.serialize(() => {
            if (Object.keys(req.body)[0].split(' ')[0] == 'select' || Object.keys(req.body)[0].split(' ')[0] == 'SELECT') {
                db.all(`${Object.keys(req.body)[0]}`, (err, rows) => {
                    if (err) {
                        console.log(err.message)
                        res.status(400).send(err.message)
                    } else {
                        if (rows) {
                            res.send({'type': 'customTable', 'rows': rows})
                            console.log('rows',rows)
                        } else {
                            console.log('rows',rows)
                            res.send({'type': 'emptyCustomTable', 'status': 'OK' })
                        }
                    }
                })
            } else {
               db.run(`${Object.keys(req.body)[0]}`, (err, rows) => {
                    if (err) {
                        console.log(err.message)
                        res.status(400).send(err.message)
                    } else {
                        if (rows) {
                            res.send(rows)
                            console.log('rows',rows)
                        } else {
                            console.log('rows',rows)
                            res.send({'type': 'customRequest', 'status': 'OK'})
                        }
                    }
                }) 
            }    
        })
    }) 

    app.post('/db/rowsdelete/:tablename', (req, res) => {
        res.header('Access-Control-Allow-Origin', '*')
        let db = connectDB(sql)
        let errors = []
        console.log(req.body)
        db.serialize(() => {    
            req.body.forEach(item => {
                db.run(`DELETE from ${req.params.tablename} WHERE rowid = ${item}`, err => {
                    if (err){
                        errors.push(err.message)
                    } else {
                        console.log('delete suc')
                    }
                })
            })
            if (errors.length > 0) {
                res.status(400).send(errors)
            } else {
                res.send("OK")
            }
        })
    })

    app.post('/db/addcolumn/:tablename', (req, res) => {
        res.header('Access-Control-Allow-Origin', '*')
        let db = connectDB(sql)
        console.log(req.body)
        db.serialize(() => {
            db.run(`ALTER TABLE ${req.params.tablename} ADD COLUMN ${req.body.name} ${req.body.type} ${req.body.option}`, err => {
                if (err) {
                    console.log(err.message)
                    res.status(400).send(err.message)
                } else {
                    console.log("add column suc")
                    res.send("OK")
                }
            })
        })
    })

    // TODO 
    app.post('/db/deletecolumn/:tablename', (req, res) => {
        res.header('Access-Control-Allow-Origin', '*')
        let db = connectDB(sql)
        console.log(req.body) 
        let rowsTypeString = ""
        let newRows = []
        db.serialize(() => {
            db.all(`pragma table_info(${req.params.tablename})`,  (err, rows) => {
                if (err) {
                    console.log(err.message)
                    res.send(err.message)
                } else {
                    let temp = rows.map(item => item.name).indexOf(req.body.name)
                    rows.splice(temp, 1) 
                    newRows = rows
                    console.log('newrows:', newRows)
                    rows.forEach((item, index) => {
                        rowsTypeString += `${item.name} ${item.type}`
                        rowsTypeString += index < rows.length - 1 ? ', ' : ''
                    })
                    db.run(`ALTER TABLE ${req.params.tablename} RENAME TO ${req.params.tablename}_DELCOLUMN`, err => {
                        if (err) {
                            console.log('Rename', err.message)
                            res.send(err.message)
                        } else {
                            console.log("RENAME OK")
                            db.run(`CREATE TABLE ${req.params.tablename}(${rowsTypeString})`, err => {
                                if (err) {
                                    console.log(`CREATE TABLE ${req.params.tablename}(${rowsTypeString})`)
                                    console.log('crate', err.message)
                                    res.send(err.message)
                                } else{
                                    console.log("CREATE OK")
                                    db.run(`INSERT INTO ${req.params.tablename}( ${newRows.map(item => item.name).join(', ')} )
                                        SELECT ${newRows.map(item => item.name).join(', ')} 
                                        FROM ${req.params.tablename}_DELCOLUMN `, err => {
                                        if (err) {
                                            console.log(`INSERT INTO ${req.params.tablename}( ${newRows.map(item => item.name).join(', ')} )
                                            SELECT ${newRows.map(item => item.name).join(', ')} 
                                            FROM ${req.params.tablename}_DELCOLUMN`)
                                            console.log('insert', err.message)
                                            res.send(err.message)
                                        } else{
                                            console.log("insert OK")
                                            db.run(`DROP TABLE ${req.params.tablename}_DELCOLUMN`, err => {
                                                if (err) {
                                                    console.log('drop:', err.message)                                                    
                                                    res.send(err.message)
                                                } else {
                                                    console.log('DROP OK')
                                                    res.send('OK')
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            })
        })
    })
}