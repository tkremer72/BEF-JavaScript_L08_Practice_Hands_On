var express = require('express');
var router = express.Router();
var models = require('../models'); //<--- Add models
var authService = require('../services/auth'); //<--- Add authentication service

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

router.get('/signup', function(req, res, next) {
  res.render('signup');
});
// Create new user if one doesn't exist
router.post('/signup', function(req, res, next) {
  models.users
    .findOrCreate({
      where: {
        Username: req.body.username
      },
      defaults: {
        FirstName: req.body.firstName,
        LastName: req.body.lastName,
        Email: req.body.email,
        Password: authService.hashPassword(req.body.password) //<--- Change to this code here
      }
    })
    .spread(function(result, created) {
      if (created) {
        res.redirect('login');
      } else {
        res.send('This user already exists');
      }
    });
});
router.get('/login', function(req, res, next) {
  res.render('login');
});
//New login user and return jwt as cookie with hashedpassword
router.post('/login', function (req, res, next) {
  models.users.findOne({
    where: {
      Username: req.body.username
    }
  }).then(user => {
    if (!user) {
      console.log('User not found')
      return res.status(401).json({
        message: "Login Failed"
      });
    } else {
      let passwordMatch = authService.comparePasswords(req.body.password, user.Password);
      if (passwordMatch) {
        let token = authService.signUser(user);
        res.cookie('jwt', token);
        res.send('Login successful');
      } else {
        console.log('Wrong password');
        res.send('Wrong password');
      }
    }
  });
});
/*
// Login user and return JWT as cookie
router.post('/login', function (req, res, next) {
  models.users.findOne({
    where: {
      Username: req.body.username,
      Password: req.body.password
    }
  }).then(user => {
    if (!user) {
      console.log('User not found')
      return res.status(401).json({
        message: "Login Failed"
      });
    }
    if (user) {
      let token = authService.signUser(user); // <--- Uses the authService to create jwt token
      res.cookie('jwt', token); // <--- Adds token to response as a cookie
      res.send('Login successful');
    } else {
      console.log('Wrong password');
      res.redirect('login')
    }
  });
});*/
//Create a profile route that verfies if the user is an admin before displaying the profile
/*router.get('/profile/:id', authService.verifyUser, function(req, res, next) {

//  if (!req.isAuthenticated()) {
//   return res.send('You are not authenticated');
//}
  if (req.params.id !== String(req.user.UserId)) {
    res.send('This is not your profile');
  } else {
    let status;
    if (req.user.Admin) {
      status = 'Admin';
    } else {
      status = 'Normal user';
    }
    models.users
    .findByPk(parseInt(req.user.UserId))
    .then(user => {
      if(user){
        res.render('profile', {
          FirstName: req.user.FirstName,
          LastName: req.user.LastName,
          Email: req.user.Email,
          UserId: req.user.UserId,
          Username: req.user.Username,
          Status: status
        });
      }
    });
    
  }
});*/

//Create a secure profile view route
router.get('/profile/:id', authService.verifyUser, function(req, res, next) {
  let token = req.cookies.jwt;
  if(!req.isAuthenticated(token)){
    return res.send('You are not authenticated');
  }
  if(req.params.id !== String(req.user.UserId)) {
    res.send('This is not your profile');
  } else {
    let status;
    if(req.user.Admin) {
      status = 'Admin';
    }else {
      status = 'Normal User'
    }
    models.users
    .findByPk(req.params.id)
    .then(user => {
      if(user.admin) {
        res.render('profile', {
          FirstName: req.user.FirstName,
          LastName: req.user.LastName,
          Email: req.user.Email,
          Username: req.user.Username,
          Status: req.user.status
        })
      }
    });
  }
});
//Create a logout route
router.get('/logout', function (req, res, next) {
  res.cookie('jwt', "", { expires: new Date(0) });
  res.send('Logged out');
  });
module.exports = router;
