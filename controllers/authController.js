const User = require('../models/user');
const bcrypt = require('bcryptjs');
const { capitalize } = require('../helpers/capitalize');
const { generateToken } = require('../helpers/generateToken');
const { validationResult } = require('express-validator');
const errorHandler = require('../utils/errorHandler');
const transporter = require('../helpers/transporter');
const herokuHost = require('../helpers/herokuhost');

module.exports.getCheckAccount = async (req, res, next) => {
  try {
    if (req.session.user) {
      res.redirect('/game/prepare')
    } else {
      const [message] = await req.consumeFlash('authInfo');
      res.render('auth/CheckAccountView', {
        title: 'The Quiz Game - guest',
        message,
      })
    }
  } catch (err) {
    errorHandler(err, next)
  }
}

module.exports.getSignUp = async (req, res, next) => {
  try {
    const [message] = await req.consumeFlash('authInfo');
    const name = req.session.user ? req.session.user.name : '';
    res.render('auth/SignUpView.js', {
      title: 'The Quiz Game - sign up',
      message,
      inputValues: {
        name,
        email: '',
        password: '',
        confirmpassword: '',
      },
      canTransfer: req.session.user ? true : false,
    })
  } catch (err) {
    errorHandler(err, next)
  }
}

module.exports.getConfirmSignUp = async (req, res, next) => {
  try {
    const { signUpToken } = req.params;
    const confirmedUser = await User.findOneAndUpdate({ signUpToken, signUpTokenExpiration: { $gt: Date.now() } }, {
      isSignedUp: true,
      isLoggedIn: true,
      signUpToken: null,
      signUpTokenExpiration: null,
    }, { useFindAndModify: false }).exec();
    if (!confirmedUser) {
      req.flash('authInfo', 'Something went wrong, try again or please sign up for a new account.');
      return res.redirect('/auth/signup');
    }
    req.session.user = confirmedUser;
    await req.flash('authInfo', 'Your account created!');
    req.session.save((err) => {
      if (err) errorHandler(err, next);
      res.redirect('/');
    })
  } catch (err) {
    errorHandler(err, next)
  }
}

module.exports.postSignUp = async (req, res, next) => {
  try {
    const { name, email, password, confirmpassword, transfer } = req.body;
    const avatar = req.file ? req.file.path : null;

    const errors = validationResult(req);
    const [err] = errors.array()
    if (!errors.isEmpty() || req.multerError) {
      if (req.multerError) err.msg = req.multerError;
      return res.render('auth/SignUpView.js', {
        title: 'The Quiz Game - sign up',
        message: err.msg,
        inputValues: { name, email, password, confirmpassword },
        canTransfer: req.session.user ? true : false,
      })
    }

    let message = [];
    const isMailInDB = await User.findOne({ email }).exec();
    const isNameInDB = await User.findOne({ name: capitalize(name) }).exec();
    const checkedSession = req.session.user || {};
    if (isMailInDB || isNameInDB && isNameInDB.name !== checkedSession.name) {
      if (isMailInDB) message = [...message, 'This e-mail address exists in our base. Please Log In using it or Sign Up using another e-mail address'];
      if (isNameInDB && isNameInDB.name !== checkedSession.name) message = [...message, 'User with this name exists in our base. Please chose the other nick-name for more clear score tables'];
      return res.render('auth/SignUpView.js', {
        title: 'The Quiz Game - sign up',
        message: message.join(',  '),
        inputValues: { name, email, password, confirmpassword },
      })
    }
    const salt = await bcrypt.genSalt(12);
    const encryptedPass = await bcrypt.hash(password, salt);
    const signUpToken = await generateToken()

    const currentUserData = transfer && req.session.user ? req.session.user.toObject() : {};
    const userData = {
      ...currentUserData,
      name: capitalize(name),
      email,
      avatar,
      password: encryptedPass,
      isSignedUp: false,
      isLoggedIn: false,
      signUpToken,
      signUpTokenExpiration: Date.now() + 3600000,
    }

    if (!req.session.user) {
      const newUser = new User(userData)
      await newUser.save()
      await req.flash('authInfo', 'Please check your mail (also SPAM foldel) and click the link there to confirm your address.');
      req.session.save((err) => {
        if (err) console.log(err);
        res.redirect('/auth/login');
      })
    } else {
      const user = await User.findOneAndReplace({ _id: req.session.user._id }, userData, { useFindAndModify: false }).exec()
      if (!user) {
        req.session.destroy((err) => {
          if (err) console.log(err);
          return res.redirect('/auth/signup')
        })
      }
      await req.flash('authInfo', 'Please check your mail (also SPAM foldel) and click the link there to confirm your address.');
      res.redirect('/auth/login');
    }
    transporter.sendMail({
      from: '"QUIZ GAME" <test@test.pl>',
      to: email,
      subject: "e-mail address confirmation",
      html: `
    <p> You requested to sign up for a new account in QUIZ GAME using this e-mail address: ${email}</p>
    <p><a href="${herokuHost}/auth/signup/${signUpToken}">Click this link to confirm</a></p>
    <p>If it\'s someone\'s mistake and you don\'t intend to sign up in QUIZ GAME, just ignore this message, we won\'t use your e-mail address.</p>`,
    })
  } catch (err) {
    errorHandler(err, next)
  }
}

module.exports.getLogIn = async (req, res, next) => {
  try {
    const [message] = await req.consumeFlash('authInfo');
    res.render('auth/LogInView.js', {
      title: 'The Quiz Game - log in',
      message,
      inputValues: { email: '' }
    })
  } catch (err) {
    errorHandler(err, next)
  }
}

module.exports.postLogIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const errors = validationResult(req);
    const [err] = errors.array()
    if (!errors.isEmpty()) {
      return res.render('auth/LogInView.js', {
        title: 'The Quiz Game - log in',
        message: err.msg,
        inputValues: { email }
      })
    }

    const user = await User.findOne({ email }).exec()
    if (!user) {
      await req.flash('authInfo', 'We don\'t have this e-mail address in the base. Type a correct one or Sign Up for a new account.');
      return res.redirect('/auth/login');
    } else {
      if (!user.isSignedUp) {
        await req.flash('authInfo', 'This account\'s e-mail address is not confirmed. Please check your mail (also SPAM foldel) and click the link there to confirm your address.');
        return res.redirect('/auth/login');
      }
    }
    const isPassMatching = await bcrypt.compare(password, user.password);
    if (isPassMatching) {
      const newLoggedUser = await User.findOneAndUpdate({ email }, {
        isLoggedIn: true,
      }, { useFindAndModify: false }).exec()
      req.session.user = newLoggedUser;
      req.session.save(async (err) => {
        if (err) console.log(err)
        await req.flash('authInfo', 'Successfully logged in.');
        res.redirect('/')
      })
    } else {
      await req.flash('authInfo', 'Wrong password ... Try again or reset password or Sign Up for a new account.');
      res.redirect('/auth/login')
    }
  } catch (err) {
    errorHandler(err, next)
  }
}

module.exports.getLogOut = async (req, res, next) => {
  try {
    await User.findOneAndUpdate({ _id: req.session.user._id }, {
      isLoggedIn: false,
    }, { useFindAndModify: false }).exec()
    req.session.destroy((err) => {
      if (err) console.log(err);
      res.redirect('/')
    })
  } catch (err) {
    errorHandler(err, next)
  }
}













module.exports.getResetPass = async (req, res, next) => {
  const [message] = await req.consumeFlash('authInfo');
  res.render('auth/ResetPassView.js', {
    title: 'The Quiz Game - reseting',
    inputValues: { email: '', },
    message,
  })
}

module.exports.postResetPass = async (req, res, next) => {
  try {
    const { email } = req.body;
    const errors = validationResult(req);
    const [err] = errors.array()
    if (!errors.isEmpty()) {
      return res.render('auth/ResetPassView.js', {
        title: 'The Quiz Game - reseting',
        inputValues: { email },
        message: err.msg,
      })
    }

    const resetingUser = await User.findOne({ email }).exec()
    if (!resetingUser) {
      return res.render('auth/ResetPassView.js', {
        title: 'The Quiz Game - reseting',
        inputValues: { email },
        message: 'We don\'t have this e-mail address in the base. Type a correct one.'
      })
    }
    const resetToken = await generateToken()
    resetingUser.resetToken = resetToken;
    resetingUser.resetTokenExpiration = Date.now() + 3600000,
      await resetingUser.save()
    await req.flash('authInfo', 'OK - now confirm your reset request via your e-mail address (check also SPAM folder).');
    res.redirect('/auth/resetpass')
    transporter.sendMail({
      from: '"QUIZ GAME" <test@test.pl>',
      to: email,
      subject: "reseting password ...",
      html: `
    <p> You requested to reset a password for the account in QUIZ GAME connected to this e-mail address: ${email}</p>
    <p><a href="${herokuHost}/auth/resetpass/${resetToken}">Click this link to reset.</a></p>`
    })
  } catch (err) {
    console.log(err)
  }
}


module.exports.getResetPassConfirm = async (req, res, next) => {
  const { resetToken } = req.params;
  const resetingUser = await User.findOneAndUpdate({ resetToken, resetTokenExpiration: { $gt: Date.now() } }, { useFindAndModify: false }).exec()
  if (!resetingUser) {
    req.flash('authInfo', 'Something went wrong, try again.');
    return res.redirect('/auth/resetpass');
  }
  res.render('auth/NewPassView.js', {
    title: 'The Quiz Game - reseting',
    resetToken,
    message: null,
    userId: resetingUser._id.toString(),
  })
}

module.exports.postNewPass = async (req, res, next) => {
  try {
    const { resetToken, userId, password, confirmpassword } = req.body;
    const resetingUser = await User.findOne({
      resetToken,
      resetTokenExpiration: { $gt: Date.now() },
      _id: userId
    }).exec()
    if (!resetingUser) {
      req.flash('authInfo', 'Something went wrong, try again. ??');
      return res.redirect('/auth/resetpass');
    }

    const errors = validationResult(req);
    const [err] = errors.array()
    if (!errors.isEmpty()) {
      return res.render('auth/NewPassView.js', {
        title: 'The Quiz Game - reseting',
        resetToken,
        message: err.msg,
        userId: resetingUser._id.toString(),
      })
    }

    const salt = await bcrypt.genSalt(12);
    const encryptedPass = await bcrypt.hash(password, salt);
    resetingUser.password = encryptedPass;
    resetingUser.resetToken = null;
    resetingUser.resetTokenExpiration = null;
    await resetingUser.save()
    req.flash('authInfo', 'Your password has been reseted.');
    res.redirect('/auth/login');
  } catch (err) {
    console.log(err)
  }
}