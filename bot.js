require('dotenv').config()

const tmi = require('tmi.js');

// Define configuration options
// Load variables from .env file
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

// blind variable
let isBlind = false;
const safeword = "chupacabra";

// queue variables
let queueIsOpen = false;
let queue = [];

// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {
  if (self) { return; } // Ignore messages from the bot

  // Remove whitespace from chat message and tokenize
  msg_parts = msg.trim().split(" ")
  const command = msg_parts[0];
  const argument = msg_parts[1];
  const argument_2 = msg_parts[2];

  if (command[0] == '!') {

    console.log(`Recieved a command:`)
    console.log(`  target: ${target}`)
    console.log(`  msg: ${msg}`)

    // If the command is known, let's execute it
    switch(command) {
      case "!commands":
        return_msg = "Available commands: !bot, !social(s), !controller, !lurk, !unlurk, !brb, !joke, !blind, !safeword, !queue, !join"
        sendMessage(target, return_msg, command)
        break;
      case "!bot":
        return_msg = "Teaja wrote me himself (based on a tutorial code). https://github.com/thomas-j-sell/twitch-chatbot"
        sendMessage(target, return_msg, command)
        break;
      case "!socials": // fall through
      case "!social":
        sendMessage(target, socials(), command)
        break;
      case "!controller":
        sendMessage(target, "I use a Scuf Impact: https://scufgaming.com/playstation-impact-controller")
        break;
      case "!lurk":
        return_msg = `${getLurkMessage()} Thanks for the lurk ${context['display-name']} !`
        sendMessage(target, return_msg, command)
        break;
      case "!unlurk":
        sendMessage(target,  `Welcome back ${context['display-name']}.`, command)
        break;
      case "!brb":
        return_msg = "I have to step away for a moment, but I'll be right back. Would you kindly stick around?"
        sendMessage(target, return_msg, command)
        break;
      case "!joke":
        sendMessage(target, getJoke(), command)
        break;
      case "!blind":
        switch(argument) {
          case "on":
            if (isMod(context)) {
              isBlind = true
              sendMessage(target, "Blind mode is now on.", command)
            } else {
              return_msg = `Sorry ${context['display-name']}, only mods can do that.`
              sendMessage(target, return_msg, command)
            }
            break;
          case "off":
            if (isMod(context)) {
              isBlind = false
              sendMessage(target, "Blind mode is now off.", command)
            } else {
              return_msg = `Sorry ${context['display-name']}, only mods can do that.`
              sendMessage(target, return_msg, command)
            }
            break;
          default:
            if (isBlind) {
              return_msg = `This is a blind play-through. Please do not give any hints, tips, or criticisms unless I explicitly ask for them using my safeword: ${safeword}.`
              sendMessage(target, return_msg, command)
            } else {
              return_msg = "This is not a blind playthrough. Tips, hints, and other constructive criticisms are welcome."
              sendMessage(target, return_msg, command)
            }
            break;
        }
        break;
      case "!safeword" || "!safe word":
        sendMessage(target, `My safeword is ${safeword}.`, command)
        break;
      case "!queue":
          switch(argument) {
            case "open":
              if (isMod(context)) {
                queueIsOpen = true;
                return_msg = "The queue is now open. You can join with !join."
                sendMessage(target, return_msg, command)
              } else {
                return_msg = `Sorry ${context['display-name']}, only mods can do that.`
                sendMessage(target, return_msg, command)
              }
              break;
            case "close":
              if (isMod(context)) {
                queueIsOpen = false;
                return_msg = "The queue is now closed."
                sendMessage(target, return_msg, command)
              } else {
                return_msg = `Sorry ${context['display-name']}, only mods can do that.`
                sendMessage(target, return_msg, command)
              }
              break;
            case "next":
              if (isMod(context)) {
                if (queue.length > 0) {
                  let next = queue.shift()
                  return_msg = `${next} is up next.`
                } else {
                  return_msg = "Queue is empty so there's no one to pop."
                }
                sendMessage(target, return_msg, command)
              } else {
                return_msg = `Sorry ${context['display-name']}, only mods can do that.`
                sendMessage(target, return_msg, command)
              }
              break;
            case "rules":
              return_msg = "Queue is FIFO (first in first out). Place in the queue is good for two games, but I might add a third if one gets cut really short."
              sendMessage(target, return_msg, command)
              break;
            default:
              if (queue.length == 0) {
                if (queueIsOpen) {
                  return_msg = "Queue is currently empty. You can join with !join."
                } else {
                  return_msg = "Queue is currently empty. You cannot currently join."
                }
              } else {
                return_msg = queue.toString()
              }
              sendMessage(target, return_msg, command)
          }
        break;
      case "!join":
        if (queueIsOpen) {
          if (queue.includes(context['display-name'])) {
            let place = queue.indexOf(context['display-name']) + 1
            return_msg = `You are already in the queue ${context['display-name']}. Your position in line is ${place}.`
          } else {
            queue.push(context['display-name'])
            let place = queue.indexOf(context['display-name']) + 1
            return_msg = `You have been added to the queue ${context['display-name']}. Your position in line is ${place}.`
          }
          sendMessage(target, return_msg, command)
        } else {
          return_msg = `Sorry ${context['display-name']}, the queue is closed.`
          sendMessage(target, return_msg, command)
        }
        break;
      default:
        console.log(`Unknown command ${command}`)
    }
  } else {
    // console.log('not a command')
    // do nothing for regular messages
  }
}

// sends
function sendMessage(target, return_msg, command) {
  client.say(target, return_msg)
  console.log(`Executed ${command} command`)
}

// !song: print message about the currently playing song
function socials () {
  return "Hey! Listen! If you want to keep up with me on social media you can follow on these platforms: twitter.com/teaja instagram.com/dredgen_teaja"
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}

// returns a random inteter between min and max
// inclusive of min, exclusive of max
function randomInt (min, max) {
  return Math.floor(Math.random() * (max-min) + min);
}

// check if user has mod priviliges
function isMod (context) {
  return context['badges'] != null && ('broadcaster' in context['badges'] || 'moderator' in context['badges'])
}

// returns random message from list of lurk messages
function getLurkMessage () {
  return lurkMessages[randomInt(0, lurkMessages.length)];
}

// list of lurk messages
const lurkMessages = [
  "Lurk, Lurk, Lurk.",
  "Live, laugh, Lurk.",
  "Can you feel the lurk tonight?",
  "It's the circle of lurk.",
  "Lurkin at the car wash."
];

// returns random message from list of brb messages
function getBrbMessage() {
  return brbMessages[randomInt(0, brbMessages.length)];
}
// list of brb messages
const brbMessages = [
  "Would you kindly stick around",
  "Stay a while and listen"
]

// returns joke from list of jokes
function getJoke () {
  return jokes[randomInt(0, jokes.length)];
}

// list of jokes
const jokes = [
  "Some people think filling animals with helium is wrong… I don't judge, whatever floats your goat.",
  "So there was this pun contest…  I entered ten puns in the hopes that one might win. No pun in ten did.",
  "My professor accused me of plagiarism. His words, not mine.",
  'A neutron walked into a bar and asked “how much for a drink?”. The bartender said: "for you, no charge".',
  "Mountains aren't just funny, they're hill areas.",
  "Shipment of viagra stolen. Police searching for gang of hardened criminals.",
  "If I had to rate our solar system I'd give it one star… or 8/9.",
  "I just want a job cleaning mirrors. It's really a job I could see myself doing.",
  "I buy all my guns from a guy named T-Rex. He's a small arms dealer.",
  "Why does Snoop Dogg use an umbrella? Fo drizzle.",
  "I’m only familiar with 25 letters in the English language. I don’t know why.",
  "Sheep dog: All 30 sheep are ready. Farmer: But I only count 26. Sheep dog: Yes, I rounded them up for you",
  "What's Harry Potter's favorite way to get down a hill? Walking... JK Rolling.",
  "I have an irrational fear of speed bumps, but I'm slowly getting over it.",
  "What do you call a singing computer? A dell.",
  "I have a phobia of overly engineered buildings. It's a complex complex complex.",
  "What kind of train eats too much? A chew chew train.",
  "Dr. Frankenstein entered a body building competition and discovered he had seriously misunderstood the objective.",
  "Cigarettes are a lot like hamsters; harmless until you put one in your mouth and light it on fire.",
  "When does a joke become a dad joke?  When it's fully groan.",
  "Orion's Belt is a big waist of space. Terrible joke, only three stars.",
  "Where did Noah keep his bees? In the arc hives.",
  'A Mexican magician told an audience he would disappear on the count of 3.  "Uno, dos, poof."  He disappeared without a tres.',
  "What do you get when you drop a piano on a child? A flat minor.",
  "Why do seagulls fly over the sea? If the flew over the bay they'd be called bagels.",
  "Why do chicken coups only have 2 doors? If they had 4 they'd be chicken sedans.",
  "To the person who stole my copy of Microsoft office: I will find you, you have my word.",
  "Whiteboards: they're remarkable.",
  "How do you count cows? With a cowculator.",
  "I wanted to invest in the Egyptian tourism market. But I realized it's just a pyramid scheme.",
  "Diarrhea is hereditary. It runs in your jeans.",
  "My preferred way to deal with things is to pretend I'm the pope. It's my poping mechanism.",
  "To the guy that invented zero, thanks for nothing.",
  "Did you hear about the fire at the shoe factory? 100 soles were lost.",
  "My friend David had his ID stolen the other day. Now we just call him Dav.",
  "Did you hear about the gummy bear that was missing a leg? He lost in it nom.",
  "I dig, you dig, he dig, she dig, they dig. It's not a beautiful poem, but it's deep.",
  "The invention of the shovel was… ground breaking.",
  "6 out of 7 dwarves aren’t happy.",
  "What did the seal with the broken arm say to the shark? Don’t consume if seal is broken.",
  "How did the hammerhead do on his test? He nailed it.",
  "Where is happiness made? At the satisfactory.",
  "If towels could tell jokes they’d probably have a dry sense of humor.",
  "Imagine if the US switched from pounds to kilograms overnight. There would be mass confusion.",
  "Last night I was attacked by mimes. They did unspeakable things to me.",
  "Most people are shocked to learn how incompetent I am as an electrician.",
  "I took part in the sun tanning Olympics. I only got bronze.",
  'A horse walks into a bar. The bartender says “hey”. The horse replies “Sure”.',
  "I used to sell security alarms door to door.  If no one was home I’d just leave a brochure on the kitchen table.",
  "I’ve had amnesia for as long as I can remember.",
  "What do you call a sea creature that uses a fake name? A pseudonemone.", "I’ve been diagnosed with a fear of giants. Feefiphobia.",
  "I’m not fond of cheese.  You could say I’m a curd-mudgeon.",
  "I love jokes about eyes, the cornea the better.",
  "I need to cut my fingernails, they’re really getting out of hand.",
  "Just saw someone rob the Apple store.  I’m now an iWitness.",
  "Why don’t birds like asking for directions? They like to wing it.",
  "What do toes and strawberries have in common? Jam.",
  "Where do you learn to make ice cream? Sundae school.",
  "Did you hear the story about the dog who traveled 1000 miles to pick up a stick. It sounds far fetched.",
  "What do you call a bear with no teeth? A gummy bear.",
  "Did you head about the guy that got hit in the head with a soda can? He was lucky it was a soft drink.",
  "What did the mermaid wear to math class. An algae bra.",
  "How does a mansplainer drink? From a well, actually.",
  "In college my nickname was the love machine. It’s true I was really bad at tennis.",
  "My girlfriend got sick of my beekeeping hobby. She told me I had to chose between her and the bees.  I saw her face and now I’m a bee-leaver.",
  "I made a new playlist for hiking. It has music from Penuts, the Cranberries, and Eminem. I call it my trail mix.",
  "I bought some shoes from a drug dealer. I don’t know what he laced them with, but I was tripping all day.",
  "Give a man a duck, and he'll eat for a day. Teach a man to duck, and he'll never walk into a bar."
];
