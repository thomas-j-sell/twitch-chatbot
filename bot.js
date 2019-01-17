require('dotenv').config()

const tmi = require('tmi.js');

// Define configuration options
const opts = {
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.OAUTH_TOKEN
  },
  channels: [
    process.env.CHANNEL_NAME
  ],
  connection: {
    reconnect: true
  }
};

// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();

// create an array to store points
points_table = {};

// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {
  if (self) { return; } // Ignore messages from the bot
  console.log(`Recieved a message:`)
  console.log(`  target: ${target}`)
  console.log(`  context: ${context}`)
  console.log(`  msg: ${msg}`)

  // Remove whitespace from chat message and tokenize
  msg_parts = msg.trim().split(" ")
  const command = msg_parts[0];
  const argument = msg_parts[1];
  const argument_2 = msg_parts[2];

  // If the command is known, let's execute it
  switch(command) {
    case "!song":
      client.say(target, song())
      console.log(`Executed ${command} command`)
      break;
    case "!games":
      client.say(target, games())
      console.log(`Executed ${command} command`)
      break;
    case "!points":
      return_msg = points(target, argument, argument_2)
      client.say(target, return_msg)
      break;
    default:
      console.log(`Unknown command ${command}`);
  }
}

// !song: print message about the currently playing song
function song () {
  return "I don't listen to music while I play.  This is the game as it was intended to sound (but with my voice sometimes)."
}

// !games: print message about my favorite current games
function games () {
  return `
  Spider-Man,
  Destiny 2,
  Firewatch,
  The Witness
  `
}

// !points: assing or check points
// If I make the command add points to someones total
// If someone else enters the command return their point total
// TODO this is very ugly, clean up soon
function points (user, target, argument) {
  if (user === '#dredgen_teaja') {
    if (points_table[target]) {
      points_table[target] += Number(argument)
    } else {
      points_table[target] = 0
      points_table[target] += Number(argument)
    }
    return `total points for ${target}: ${points_table[target]}`
  } else {
    return `total points for ${user}: ${points_table[user]}`
  }
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}
