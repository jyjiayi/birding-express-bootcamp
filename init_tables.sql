CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT,
  password TEXT
);

CREATE TABLE IF NOT EXISTS species (
  id SERIAL PRIMARY KEY,
  name TEXT,
  scientific_name TEXT
);

CREATE TABLE IF NOT EXISTS behaviour (
  id SERIAL PRIMARY KEY,
  action TEXT
);

CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  flock_size INTEGER,
  user_id INTEGER REFERENCES users(id),
  species_id INTEGER REFERENCES species(id),
  date TEXT,
  behaviour TEXT
);

INSERT INTO species (name, scientific_name) VALUES ('Wandering Whistling Duckling Duck', 'Dendrocygna arcuata'), ('Lesser Whistling Duck', 'Dendrocygna javanica'), ('Cotton Pygmy Goose', 'ettapus coromandelianus'), ('Gadwall', 'Anas strepera'), ('Eurasian Wigeon', 'Anas penelope'), ('Northern Shoveler','Anas clypeata'), ('Northern Pintail', 'Anas acuta'), ('Garganey', 'Anas querquedula'), ('Eurasian Teal', 'Anas crecca'), ('Tufted Duck', 'Aythya fuligula'), ('Red Junglefowl', 'Gallus gallus');        