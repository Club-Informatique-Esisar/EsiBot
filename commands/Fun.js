function shuffle(a) {
    for (let i = a.length; i; i--) {
        let j = Math.floor(Math.random() * i)
        [a[i - 1], a[j]] = [a[j], a[i - 1]]
    }
}

async function randomEmojiCommand({ message, args, emojis }) {
  let str = ''
  for (let i = 0; i < Math.min(+args[0], 100); i++) {
    str += emojis.random().emoji
  }
  message.channel.send(str)
}

module.exports = function (cm) {
  cm.registerCommand({
    name: 'random',
    desc: 'Plein de choses aléatoires',
    subcommands: [
      {
        name: 'emoji',
        handler: randomEmojiCommand,
        desc: `*Le Monde des Emojis* - 2.6/10 IMDB.com`,
        args: 1,
        params: '<count[0-100]>',
        esiguildOnly: false
      }
    ],
    esiguildOnly: false
  })
}