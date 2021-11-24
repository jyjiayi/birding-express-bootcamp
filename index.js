import express from 'express';
import pg from 'pg';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';

const { Pool } = pg;

// determine how we connect to the local Postgres server
const pgConnectionConfigs = {
  user: 'jyjyjiayi',
  host: 'localhost',
  database: 'birdingdb',
  port: 5432,
};

const pool = new Pool(pgConnectionConfigs);

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(cookieParser());

// render a list of all the notes
app.get('/', (req, res) => {
  const sqlQuery = 'SELECT notes.id, notes.flock_size, notes.user_id, notes.species_id, notes.date, notes.behaviour, species.id AS species_table_id, species.name AS species_name, species.scientific_name FROM notes INNER JOIN species ON species.id = notes.species_id';
  pool.query(sqlQuery, (error, result) => {
    if (error) {
      console.log('error');
    }
    else {
      const data = { notes: result.rows };
      res.render('main-page', data);
    }
  });
});

// render a form that will create a new note
app.get('/note', (req, res) => {
  const sqlQuery = 'SELECT * FROM species';
  pool.query(sqlQuery, (error, result) => {
    if (error) {
      console.log('error');
    }
    else {
      const data = { species: result.rows };
      res.render('note', data);
    }
  });
});

// accept a POST request to create a new note
app.post('/note', (req, res) => {
  const entryData = req.body;
  const speciesSqlQuery = 'SELECT * FROM species WHERE id = $1';
  const speciesId = [Number(entryData.species)];

  pool.query(speciesSqlQuery, speciesId, (error, result) => {
    if (error) {
      console.log('Error: species query');
    }
    else {
      const currentSpecies = result.rows.name;
      const noteSqlQuery = 'INSERT INTO notes (flock_size, date, species_id, behaviour) VALUES ($1, $2, $3, $4) RETURNING *';
      const noteData = [Number(entryData.flock_size), entryData.date, entryData.species, entryData.behaviour];

      pool.query(noteSqlQuery, noteData, (error2, result2) => {
        if (error) {
          console.log('Error: note query');
        }
        else {
          console.log('result2', result2.rows);
          const noteId = Number(result2.rows[0].id);
          const data = { note: result2.rows[0], noteId };
          res.render('single-note', data);
        }
      });
    }
  });
});

// render a single note
app.get('/note/:index', (req, res) => {
  const noteSqlQuery = 'SELECT notes.id, notes.flock_size, notes.user_id, notes.species_id, notes.date, notes.behaviour, species.id AS species_table_id, species.name AS species_name, species.scientific_name FROM notes INNER JOIN species ON species.id = notes.species_id WHERE notes.id = $1';
  const noteId = Number(req.params.index) + 1;
  pool.query(noteSqlQuery, [noteId], (error, result) => {
    if (error) {
      console.log('Error: single note query');
    }
    else {
      const data = { note: result.rows[0], noteId };
      res.render('single-note', data);
    }
  });
});

// render a form to edit a note
app.get('/note/:index/edit', (req, res) => {
  const sqlQuery = 'SELECT * FROM species';
  pool.query(sqlQuery, (error, allSpeciesResult) => {
    if (error) {
      console.log('Error: all species query');
    }
    else {
      const allSpeciesData = allSpeciesResult.rows;
      console.log(allSpeciesData);

      const noteSqlQuery = 'SELECT notes.id, notes.flock_size, notes.user_id, notes.species_id, notes.date, notes.behaviour, species.id AS species_table_id, species.name AS species_name, species.scientific_name FROM notes INNER JOIN species ON species.id = notes.species_id WHERE notes.id = $1';
      const noteId = Number(req.params.index) + 1;
      pool.query(noteSqlQuery, [noteId], (error2, result) => {
        if (error2) {
          console.log('Error: single note query');
        }
        else {
          const data = { note: result.rows[0], noteId, allSpeciesData };
          res.render('edit', data);
        }
      });
    }
  });
});

// accept a request to edit a single note
app.put('/note/:index', (req, res) => {
  const noteId = Number(req.params.index);
  const noteData = req.body;

  const sqlQuery = `UPDATE notes SET date='${noteData.date}', flock_size='${Number(noteData.flock_size)}', species_id='${Number(noteData.species)}', behaviour='${noteData.behaviour}' WHERE id= ${noteId} RETURNING *`;
  // const values = [noteData.date, Number(noteData.flock_size), Number(noteData.species), noteData.behaviour, noteId];
  pool.query(sqlQuery, (error, result) => {
    if (error) {
      console.log('Error: update query');
    } else {
      const data = { note: result.rows[0], noteId };
      res.render('single-note', data);
    }
  });
});

app.listen(3004);
