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
          const index = Number(result2.rows[0].id);
          const data = { note: result2.rows[0], index };
          res.render('single-note', data);
        }
      });
    }
  });
});

app.get('/note/:index', (req, res) => {
  const noteSqlQuery = 'SELECT notes.id, notes.flock_size, notes.user_id, notes.species_id, notes.date, notes.behaviour, species.id AS species_table_id, species.name AS species_name, species_scientific_name FROM notes INNER JOIN species ON species.id = notes.species_id WHERE notes.id=$1';
  const { index } = req.params + 1;
  pool.query(noteSqlQuery, index, (error, result) => {
    if (error) {
      console.log('Error: single note query');
    }
    else {
      const data = { note: result.rows, index };
      res.render('single-note', data);
    }
  });
});

app.listen(3004);
