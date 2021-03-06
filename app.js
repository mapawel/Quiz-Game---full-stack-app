const debug = require('debug')('game')
require('dotenv-safe').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const { flash } = require('express-flash-message');
const rootRoutes = require('./routes/rootRoutes');
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const loggedRoutes = require('./routes/loggedRoutes');
const rootController = require('./controllers/rootController');

mongoose.connect(process.env.DBURL, { useNewUrlParser: true, useUnifiedTopology: true })
  .catch((err) => console.log('ERROR WHILE INITIAL CONNECT TO MONGODB', err));

const store = new MongoDBStore({
  uri: process.env.DBURL,
  collection: 'sessions'
});
store.on('error', function (error) {
  console.log(error);
});

const app = express();
const db = mongoose.connection;
const port = process.env.PORT || 8000;
const userSession = {
  secret: process.env.SESSIONSECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {},
  store,
}

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'js');
app.engine('js', require('express-react-views').createEngine({ throwIfNamespace: false }));


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(session(userSession));
app.use(flash({ sessionKeyName: 'flashMessage', useCookieSession: true }));


app.use((req, res, next) => {
  debug(req.method + ' ' + req.url);
  next()
})


app.use(rootController.rootUserManagingController)

app.use('/', rootRoutes);
app.use('/auth', authRoutes);
app.use('/logged', loggedRoutes);
app.use('/game', gameRoutes);

app.use(rootController.handle404);
app.use(rootController.handle500)


db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  app.listen(port, () => {
    console.log('Database connected!')
    console.log(`server started at ${port}`)
  })
});
