require('dotenv').config()
const mongoose = require('mongoose')

const connectDB = require('../config/database')
const User = require('../models/user-model')
const Keys = require('../models/keys-model')
const Level = require('../models/level-model')
const Order = require('../models/order-model')
const File = require('../models/file-model')
const Token = require('../models/token-model')
const Tournament = require('../models/tournament-model')
const TournamentUser = require('../models/tournament_user-model')

async function cleanDatabase() {
  await connectDB()

  try {
    await Promise.all([
      User.deleteMany({}),
      Keys.deleteMany({}),
      Level.deleteMany({}),
      Order.deleteMany({}),
      File.deleteMany({}),
      Token.deleteMany({}),
      Tournament.deleteMany({}),
      TournamentUser.deleteMany({}),
    ])
    console.log('All collections have been cleaned!')
  } catch (err) {
    console.error('Error cleaning database:', err)
  } finally {
    mongoose.disconnect()
  }
}

cleanDatabase().catch(err => {
  console.error('Cleaning error:', err)
  mongoose.disconnect()
}) 