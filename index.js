/* eslint-disable max-len */
import express from 'express';
import pg from 'pg';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import jsSHA from 'jssha';

const { Pool } = pg;

const SALT = 'for user auth session hashing';

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
      const noteSqlQuery = 'INSERT INTO notes (flock_size, date, user_id,species_id, behaviour) VALUES ($1, $2, $3, $4, $5) RETURNING *';
      const noteData = [Number(entryData.flock_size), entryData.date, Number(req.cookies.userId), entryData.species, entryData.behaviour];
      console.log(noteData);

      pool.query(noteSqlQuery, noteData, (error2, result2) => {
        if (error2) {
          console.log('Error: note query');
          // will be error if the userId is empty, means user is not logged in
          res.status(403).send('Please log in');
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
  // extract loggedInHash and userId from request cookies
  const { loggedInHash, userId } = req.cookies;
  // create new SHA object
  const shaObj3 = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
  // reconstruct the hashed cookie string
  const unhashedCookieString = `${userId}-${SALT}`;
  shaObj3.update(unhashedCookieString);
  const hashedCookieString = shaObj3.getHash('HEX');

  // verify if the generated hashed cookie string matches the request cookie value.
  // if hashed value doesn't match, return 403.
  if (hashedCookieString !== loggedInHash) {
    res.status(403).send('please login!');
  }
  else {
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
  }
});

// render a form to edit a note
app.get('/note/:index/edit', (req, res) => {
  // to check that user is logged in
  if (req.cookies.userId) {
  // to make sure it is the correct user to edit the note
    const noteId = Number(req.params.index);
    const getNoteInfoQuery = `SELECT * FROM notes WHERE id = ${noteId}`;
    console.log('noteId :>> ', noteId);
    pool.query(getNoteInfoQuery, (error1, result1) => {
      if (error1) {
        console.log('get note info query error');
      } else {
        const noteInfo = result1.rows[0];
        console.log('noteInfo', result1.rows);
        // if the user who created the note is same as the logged in user
        if (Number(noteInfo.user_id) === Number(req.cookies.userId)) {
          const sqlQuery = 'SELECT * FROM species';
          pool.query(sqlQuery, (error, allSpeciesResult) => {
            if (error) {
              console.log('Error: all species query');
            }
            else {
              const allSpeciesData = allSpeciesResult.rows;
              console.log(allSpeciesData);

              const noteSqlQuery = 'SELECT notes.id, notes.flock_size, notes.user_id, notes.species_id, notes.date, notes.behaviour, species.id AS species_table_id, species.name AS species_name, species.scientific_name FROM notes INNER JOIN species ON species.id = notes.species_id WHERE notes.id = $1';
              pool.query(noteSqlQuery, [noteId], (error2, result) => {
                if (error2) {
                  console.log('Error: single note query');
                }
                else {
                  const data = { note: result.rows[0], noteId, allSpeciesData };
                  console.log(data);
                  res.render('edit', data);
                }
              });
            }
          });
        }
        else {
          res.send('You are not authorised to edit this post.');
        }
      }
    });
  }
  else {
    res.status(403).send('please login!');
  }
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

// Render a form that will sign up a user
app.get('/signup', (request, response) => {
  const { loggedIn } = request.cookies;
  response.render('signup', { loggedIn });
});

// Accept a POST request to create a user
app.post('/signup', (request, response) => {
  // initialise the SHA object
  const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });

  // input the password from the request to the SHA object
  shaObj.update(request.body.password);

  // get the hashed password as output from the SHA object
  const hashedPassword = shaObj.getHash('HEX');

  const inputEmail = request.body.email;

  console.log('actual pw', request.body.password);
  console.log('hashed pw', hashedPassword);

  const inputPassword = hashedPassword;
  // store the hashed password in our DB
  const values = [inputEmail, inputPassword];
  pool.query(
    'INSERT INTO users (email, password) VALUES ($1, $2)',
    values,
    (error, result) => {
      if (error) {
        console.log('Sign Up error', error);
      } else {
        console.log(result.rows);
        response.redirect('/login');
      }
    },
  );
});

// Render a form that will log a user in
app.get('/login', (request, response) => {
  const { loggedIn } = request.cookies;
  response.render('login', { loggedIn });
});

// Accept a POST request to log a user in
app.post('/login', (request, response) => {
  // retrieve the user entry using their email
  const values = [request.body.email];

  pool.query('SELECT * from users WHERE email=$1', values, (error, result) => {
    // return if there is a query error
    if (error) {
      console.log('Log In Error', error.stack);
      response.status(503).send('Log In unsuccessful');
      return;
    }

    // we didnt find a user with that email
    if (result.rows.length === 0) {
      // the error for incorrect email and incorrect password are the same for security reasons.
      // This is to prevent detection of whether a user has an account for a given service.
      response.status(403).send('login failed! there is no user with the email');
      return;
    }

    // get user record from results
    const user = result.rows[0];
    // initialise SHA object
    const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
    // input the password from the request to the SHA object
    shaObj.update(request.body.password);
    // get the hashed value as output from the SHA object
    const hashedPassword = shaObj.getHash('HEX');

    // If the user's hashed password in the database does not match the hashed input password, login fails
    if (user.password !== hashedPassword) {
      // the error for incorrect email and incorrect password are the same for security reasons.
      // This is to prevent detection of whether a user has an account for a given service.
      response.status(403).send('login failed! incorrect password');
      return;
    }

    // The user's password hash matches that in the DB and we authenticate the user.

    // create new SHA object
    const shaObj2 = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
    // create an unhashed cookie string based on user ID and salt
    const unhashedCookieString = `${user.id}-${SALT}`;

    // generate a hashed cookie string using SHA object
    shaObj2.update(unhashedCookieString);
    const hashedCookieString = shaObj2.getHash('HEX');

    // set the loggedInHash and userId cookies in the response
    response.cookie('loggedInHash', hashedCookieString);

    response.cookie('loggedIn', true);
    response.cookie('userId', user.id);
    response.redirect('/');
  });
});

app.delete('/logout', (request, response) => {
  response.clearCookie('loggedIn');
  response.clearCookie('userId');
  response.redirect('/login');
});

app.listen(3004);
